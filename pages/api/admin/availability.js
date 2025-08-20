// /pages/api/admin/availability.js
import admin from "firebase-admin";
import '@fullcalendar/common/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/list/main.css';

/** --- Firebase Admin 안전 초기화 (base64/JSON 모두 허용) --- */
function initAdmin() {
  if (admin.apps.length) return;
  let credsRaw =
    process.env.FIREBASE_ADMIN_CREDENTIALS_JSON || process.env.FIREBASE_ADMIN_JSON;
  if (!credsRaw)
    throw new Error(
      "FIREBASE_ADMIN_CREDENTIALS_JSON or FIREBASE_ADMIN_JSON is not set"
    );
  try {
    const decoded = Buffer.from(credsRaw, "base64").toString("utf8");
    JSON.parse(decoded);
    credsRaw = decoded;
  } catch (_) {}
  const serviceAccount = JSON.parse(credsRaw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
initAdmin();
const db = admin.firestore();

/** --- 품목별 최대 수량 (프론트와 반드시 일치) --- */
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

/** ---------- 유틸: 이름/수량/시간 정규화 ---------- */

// 품목명 정규화 & 별칭(오탈자/공백/붙여쓰기 대응)
function normalizeName(raw) {
  const n = String(raw || "").replace(/\s+/g, " ").trim();
  const alias = {
    "천막가림막": "천막 가림막",
    "아이스박스70L": "아이스박스 70L",
    "아이스박스50L": "아이스박스 50L",
    "리드선50m": "리드선 50m",
    "리드선30m": "리드선 30m",
  };
  return alias[n] || n;
}

function parseQty(val) {
  if (val == null) return 0;
  if (typeof val === "number" && Number.isFinite(val))
    return Math.max(0, Math.trunc(val));
  if (typeof val === "string") {
    const m = val.match(/(\d+)/);
    if (m) return Math.max(0, parseInt(m[1], 10));
  }
  return 0;
}

// items: 다양한 스키마 허용 (qty/quantity/count/amount/selectedQty/selected/value…)
function normalizeItems(items) {
  if (Array.isArray(items)) {
    return items
      .map((it) => {
        const name = normalizeName(
          it?.name ?? it?.itemName ?? it?.title ?? it?.label
        );
        const qtyRaw =
          it?.qty ??
          it?.quantity ??
          it?.count ??
          it?.amount ??
          it?.selectedQty ??
          it?.selected ??
          it?.value;
        const qty = parseQty(qtyRaw);
        return { name, qty };
      })
      .filter((it) => it.name && it.qty > 0);
  }
  if (items && typeof items === "object") {
    return Object.entries(items)
      .map(([k, v]) => {
        const name = normalizeName(k);
        const qty = parseQty(v);
        return { name, qty };
      })
      .filter((it) => it.name && it.qty > 0);
  }
  return [];
}

// 승인 상태 문자열 다양성 대응
function isApprovedStatus(val) {
  if (val === true) return true;
  const s = String(val ?? "").trim().toLowerCase();
  // 포함 매칭으로 범용화 (예: "승인 완료", "Approved", "approved_by_admin")
  return (
    s.includes("approved") ||
    s.includes("승인") ||
    s === "true" ||
    s === "1" ||
    s === "yes"
  );
}

// 날짜 관련
function ymd(d) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getUTCDate()).padStart(2, "0")}`;
}
function addDaysUTC(d, n) {
  const nd = new Date(d.getTime());
  nd.setUTCDate(nd.getUTCDate() + n);
  return nd;
}
function monthBoundsUTC(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}
function extractDateOnly(str) {
  const m = String(str || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// KST 기반 시간 파서 (문자열 여러 포맷 허용)
function makeKSTDate(y, m, d, h = 0, min = 0) {
  // 내부 UTC: KST(+9) 보정
  return new Date(Date.UTC(y, m - 1, d, h - 9, min, 0, 0));
}
function parseKSTRange(input) {
  if (!input) return null;
  const s = String(input).trim();

  // "YYYY-MM-DD HH-HH" / "YYYY-MM-DD HH~HH"
  let m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2})\s*[-~]\s*(\d{1,2})$/
  );
  if (m) {
    const [, y, mm, d, h1, h2] = m.map(Number);
    return { start: makeKSTDate(y, mm, d, h1), end: makeKSTDate(y, mm, d, h2) };
  }

  // ISO 시작
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const dt = new Date(s);
    if (!isNaN(dt)) return { start: dt, end: dt }; // 짝으로 올 때 end 쪽에서 대체됨
  }

  // "YYYY-MM-DD"
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mm, d] = m.map(Number);
    return {
      start: makeKSTDate(y, mm, d, 0, 0),
      end: makeKSTDate(y, mm, d + 1, 0, 0),
    };
  }

  // "YYYY/MM/DD" 또는 "YYYY.MM.DD"
  m = s.match(/^(\d{4})[\/.](\d{2})[\/.](\d{2})$/);
  if (m) {
    const [, y, mm, d] = m.map(Number);
    return { start: makeKSTDate(y, mm, d), end: makeKSTDate(y, mm, d + 1) };
  }

  // "YYYY-MM-DD 16시" 같은 꼬리 제거도 허용
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, y, mm, d] = m.map(Number);
    return { start: makeKSTDate(y, mm, d), end: makeKSTDate(y, mm, d + 1) };
  }
  return null;
}

/** --- 메인 핸들러: 월 범위 내에서 ‘대여가 있는 날’만 이벤트 생성 --- */
export default async function handler(req, res) {
  try {
    // 범위: ?month=YYYY-MM  또는 ?start=YYYY-MM-DD&end=YYYY-MM-DD (end 미포함)
    let startUTC, endUTC;
    if (req.query.month) {
      ({ start: startUTC, end: endUTC } = monthBoundsUTC(req.query.month));
    } else if (req.query.start && req.query.end) {
      const s = extractDateOnly(req.query.start);
      const e = extractDateOnly(req.query.end);
      if (!s || !e)
        return res.status(400).json({ success: false, error: "Invalid date range" });
      startUTC = new Date(`${s}T00:00:00.000Z`);
      endUTC = new Date(`${e}T00:00:00.000Z`);
    } else {
      const now = new Date();
      const cur = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(
        2,
        "0"
      )}`;
      ({ start: startUTC, end: endUTC } = monthBoundsUTC(cur));
    }

    // 승인된 신청 읽기
    const snap = await db.collection("rental_requests").get();

    // 날짜별 사용량 {'YYYY-MM-DD': {'품목명': usedQty}}
    const usageByDate = {};

    snap.forEach((doc) => {
      const d = doc.data();
      if (!isApprovedStatus(d?.status)) return;

      // 저장된 여러 필드명 케이스 모두 시도
      const rStart = parseKSTRange(
        d?.rentalDateTime || d?.rentalDate || d?.startDate
      );
      const rEnd = parseKSTRange(
        d?.returnDateTime || d?.returnDate || d?.endDate
      );
      if (!rStart || !rEnd) return;

      const start = rStart.start;
      const end = rEnd.end ?? rEnd.start; // [start,end) 배타

      // 월 범위와 교집합만 일 단위로 더함
      let cur = new Date(Math.max(start.getTime(), startUTC.getTime()));
      // 날짜를 UTC 자정으로 보정
      cur = new Date(
        Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate())
      );
      const clipEnd = new Date(Math.min(end.getTime(), endUTC.getTime()));

      // 실제 items 구조가 어떤지 보고 싶으면 아래 로그 잠깐 활성화
      // console.log("DOC", doc.id, { status: d?.status, items: d?.items || d?.rentalItems || d?.itemsObject });

      while (cur < clipEnd) {
        const key = ymd(cur);
        if (!usageByDate[key]) usageByDate[key] = {};

        const items = normalizeItems(
          d?.items || d?.rentalItems || d?.itemsObject
        );
        for (const { name, qty } of items) {
          usageByDate[key][name] = (usageByDate[key][name] || 0) + qty;
        }
        cur = addDaysUTC(cur, 1);
      }
    });

    // 이벤트 생성: ‘대여가 있는 날’만
    const events = [];
    for (let day = new Date(startUTC); day < endUTC; day = addDaysUTC(day, 1)) {
      const key = ymd(day);
      const used = usageByDate[key];
      if (!used) continue;

      const lines = [];
      for (const [name, usedQty] of Object.entries(used)) {
        const limit = ITEM_LIMITS[name];
        if (typeof limit === "number") {
          const left = Math.max(0, limit - usedQty);
          lines.push(`${name} ${left}/${limit}`);
        } else {
          // 한도표에 없는 항목도 보이도록
          lines.push(`${name} (한도 미설정)`);
        }
      }

      const title = lines.join("\n"); // 줄바꿈 그대로 표시 (프론트에서 white-space:pre-line)
      events.push({
        start: key,
        allDay: true,
        title,
      });
    }

    return res.status(200).json({ success: true, events });
  } catch (e) {
    console.error(e);
    return res
      .status(500)
      .json({ success: false, error: String(e?.message || e) });
  }
}
