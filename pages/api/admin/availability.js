// /pages/api/admin/availability.js
/**
 * Admin Availability API
 * - 쿼리: ?month=YYYY-MM  (예: 2025-08)
 *   또는   ?start=YYYY-MM-DD&end=YYYY-MM-DD  (end는 미포함)
 * - 반환: FullCalendar용 events[]
 *
 * 정책(일단 기본):
 * - 'approved' 신청만 집계
 * - 날짜 단위 집계(시간 무시). 대여~반납 구간은 start(포함) ~ end(제외)로 합산
 * - ITEM_LIMITS는 프론트와 반드시 동일하게 맞출 것
 */
import admin from "firebase-admin";

// --- 안전 초기화 ---
function initAdmin() {
  if (admin.apps.length) return;

  // 두 이름 중 하나만 써도 되게 지원
  let raw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON || process.env.FIREBASE_ADMIN_JSON;
  if (!raw) throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON or FIREBASE_ADMIN_JSON is not set");

  // base64 혹은 JSON 문자열 모두 허용
  try {
    const maybeDecoded = Buffer.from(raw, "base64").toString("utf8");
    JSON.parse(maybeDecoded);
    raw = maybeDecoded;
  } catch (_) {
    // 이미 JSON이면 통과
  }
  const sa = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
initAdmin();

const db = admin.firestore();

// ✅ 품목별 최대 수량 (프론트와 반드시 동일!)
const ITEM_LIMITS = {
  "천막": 10,
  "천막 가림막": 3,
  "테이블": 33,
  "의자": 30,
  "행사용 앰프": 2,
  "이동용 앰프": 2,
  "리드선 50m": 2,
  "리드선 30m": 3,
  "운반기 대형": 2,
  "운반기 소형": 1,
  "운반기 L카트": 1,
  "아이스박스 70L": 1,
  "아이스박스 50L": 2,
  "무전기": 6,
  "확성기": 6,
  "명찰": 80,
  "이젤": 5,
  "돗자리": 9,
  "1인용 돗자리": 96,
  "목장갑": 69,
  "줄다리기 줄 15m": 1,
  "줄다리기 줄 25m": 1,
  "중형 화이트보드": 1,
};


const KST_OFFSET = 9 * 60; // minutes

function toDateOnlyStr(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysUTC(d, days) {
  const nd = new Date(d.getTime());
  nd.setUTCDate(nd.getUTCDate() + days);
  return nd;
}

function parseDateOnlyUTC(dateStr /* YYYY-MM-DD */) {
  // UTC 자정 고정
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
}

function monthBoundsUTC(yyyyMM /* '2025-08' */) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0)); // 다음달 1일(미포함)
  return { start, end };
}

// 문자열(예: "2025-08-19 13-14")에서 날짜만 뽑아 YYYY-MM-DD 반환
function extractDateOnly(str) {
  // 허용 포맷:
  // - "YYYY-MM-DD"
  // - "YYYY-MM-DD HH-mm"
  if (!str) return null;
  const m = String(str).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

export default async function handler(req, res) {
  try {
    // === 쿼리 파라미터 처리 ===
    let startUTC, endUTC;

    if (req.query.month) {
      const { start, end } = monthBoundsUTC(req.query.month);
      startUTC = start;
      endUTC = end;
    } else if (req.query.start && req.query.end) {
      startUTC = parseDateOnlyUTC(req.query.start);
      endUTC = parseDateOnlyUTC(req.query.end); // end 미포함
    } else {
      // 기본: 현재 달
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const { start, end } = monthBoundsUTC(`${y}-${m}`);
      startUTC = start;
      endUTC = end;
    }

    // === 승인된 신청서 읽기 ===
    const snap = await db
      .collection("rental_requests")
      .where("status", "==", "approved")
      .get();

    // 날짜별 사용량 집계: { 'YYYY-MM-DD': { '천막': usedQty, ... } }
    const usageByDate = {};

    snap.forEach(doc => {
      const data = doc.data();
      const rentalDateRaw = data.rentalDate;  // 예: "2025-08-19 13-14" 또는 "2025-08-19"
      const returnDateRaw = data.returnDate;  // 예: "2025-08-20 15-16" 또는 "2025-08-20"
      const items = Array.isArray(data.items) ? data.items : [];

      const startStr = extractDateOnly(rentalDateRaw);
      const endStr = extractDateOnly(returnDateRaw);

      if (!startStr || !endStr) return;

      // 집계 규칙: start(포함) ~ end(제외)
      let cur = parseDateOnlyUTC(startStr);
      const end = parseDateOnlyUTC(endStr);

      // 요청한 범위와 교집합만 집계
      while (cur < end) {
        if (cur >= startUTC && cur < endUTC) {
          const key = toDateOnlyStr(cur);
          if (!usageByDate[key]) usageByDate[key] = {};

          for (const it of items) {
            const name = it.name || it.itemName || it.title; // 필드명 다양성 방어
            const qty = Number(it.qty ?? it.quantity ?? 0);
            if (!name || !qty) continue;
            usageByDate[key][name] = (usageByDate[key][name] || 0) + qty;
          }
        }
        cur = addDaysUTC(cur, 1);
      }
    });

    // === 날짜별 남은 수량 계산 & 이벤트 변환 ===
    const events = [];
    for (let d = new Date(startUTC); d < endUTC; d = addDaysUTC(d, 1)) {
      const dayKey = toDateOnlyStr(d);
      const used = usageByDate[dayKey] || {};

      // 남은/총량 문자열 생성
      const lines = [];
      Object.entries(ITEM_LIMITS).forEach(([name, limit]) => {
        const u = used[name] || 0;
        const left = Math.max(0, limit - u);
        lines.push(`${name} ${left}/${limit}`);
      });

      // FullCalendar all-day event
      events.push({
        start: dayKey,
        end: dayKey, // all-day 단일 표시
        allDay: true,
        title: lines.join(", "),
      });
    }

    res.status(200).json({ success: true, events });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: e.message });
  }
}
