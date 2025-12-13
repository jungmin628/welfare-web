// /pages/api/check-availability.js
import admin from "firebase-admin";

/** --- Firebase Admin 안전 초기화 (base64/JSON 모두 허용) --- */
function initAdmin() {
  if (admin.apps.length) return;

  let credsRaw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (!credsRaw) throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON is not set");

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
  "천막": 9,
  "천막 가림막": 3,
  "테이블": 29,
  "의자": 30,
  "행사용 앰프": 2,
  "이동용 앰프": 2,
  "리드선 50m": 2,
  "리드선 30m": 3,
  "운반기 대형": 2,
  "운반기 소형": 1,
  "운반기 L카트": 2,
  "아이스박스 70L": 1,
  "아이스박스 50L": 2,
  "무전기": 6,
  "확성기": 6,
  "명찰": 80,
  "이젤": 8,
  "돗자리": 9,
  "1인용 돗자리": 96,
  "목장갑": 69,
  "줄다리기 줄 15m": 1,
  "줄다리기 줄 25m": 1,
  "중형 화이트보드": 1,
};

/** --- 수량 파서: "3개", " 7 ", 7, "x3" 등에서 정수 추출 --- */
function parseQty(val) {
  if (val == null) return 0;
  if (typeof val === "number" && Number.isFinite(val)) return Math.max(0, Math.trunc(val));
  if (typeof val === "string") {
    const m = val.match(/(\d+)/);
    if (m) return Math.max(0, parseInt(m[1], 10));
  }
  return 0;
}

/** --- KST 시각을 Date(UTC 내부 표현)로 만들기: y,m,d,h는 KST 기준 --- */
function makeKSTDate(y, m, d, h = 0, min = 0, sec = 0, ms = 0) {
  // JS Date는 내부적으로 UTC로 저장되므로, KST(+9)를 UTC로 바꿔 넣어줌
  // KST 시각 (y-m-d h:min) == UTC (y-m-d h-9:min)
  return new Date(Date.UTC(y, m - 1, d, h - 9, min, sec, ms));
}

/** --- 문자열 → [start,end) 구간으로 파싱 (KST 기준)
 * 지원 형식:
 *  - "YYYY-MM-DD HH-HH"   e.g., "2025-08-19 13-14" → [19일 13:00, 19일 14:00)
 *  - "YYYY-MM-DD"         → [해당일 00:00, 다음날 00:00)
 *  - ISO with tz          → new Date(str) 그대로 사용 (타임존 내장)
 */
function parseKSTRange(input) {
  if (!input) return null;
  const s = String(input).trim();

  // 1) "YYYY-MM-DD HH-HH"
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2})\s*[-~]\s*(\d{1,2})$/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    const h1 = parseInt(m[4], 10);
    const h2 = parseInt(m[5], 10);
    const start = makeKSTDate(y, mm, d, h1, 0, 0, 0);
    const end   = makeKSTDate(y, mm, d, h2, 0, 0, 0); // 끝 시각은 배타 (정각)
    return { start, end };
  }

  // 2) ISO (타임존 포함이면 정확)
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const dt = new Date(s);
    if (!isNaN(dt)) {
      // ISO는 한 시점으로만 표현되므로, 보통 start/end 각각에 대해 들어올 때만 의미 있음
      return { start: dt, end: dt }; // 호출부에서 end용으로 쓸 때 교체됨
    }
  }

  // 3) "YYYY-MM-DD"
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const d = parseInt(m[3], 10);
    const start = makeKSTDate(y, mm, d, 0, 0, 0, 0);
    const end   = makeKSTDate(y, mm, d + 1, 0, 0, 0, 0); // 다음날 00:00
    return { start, end };
  }

  return null;
}

/** --- (요청) 시작/끝 2개 입력을 [start,end)로 정규화 */
function normalizeRequestWindow(rentalDate, returnDate) {
  // 요청은 보통 두 문자열이 따로 옴
  const r1 = parseKSTRange(rentalDate);
  const r2 = parseKSTRange(returnDate);

  if (!r1 || !r2) return null;

  // ISO 단일 시점으로 들어온 경우 보정
  const start = r1.start;
  const end   = r2.end ?? r2.start;

  // 유효성: end가 start보다 뒤여야 함
  if (!(start instanceof Date) || !(end instanceof Date) || !(start < end)) return null;
  return { start, end };
}

/** --- 승인 상태 정규화 --- */
function isApprovedStatus(val) {
  return (
    val === "approved" ||
    val === "승인" ||
    val === "approved_by_admin" ||
    val === true
  );
}

/** --- items 정규화: 배열/맵 모두 → [{ name, qty }] --- */
function normalizeItems(items) {
  if (Array.isArray(items)) {
    return items
      .map((it) => {
        const name = (it?.name || it?.itemName || "").toString().trim();
        const qty =
          parseQty(it?.qty) ||
          parseQty(it?.quantity) ||
          parseQty(it?.count) ||
          0;
        return { name, qty };
      })
      .filter((it) => it.name && it.qty > 0);
  }
  if (items && typeof items === "object") {
    return Object.entries(items)
      .map(([rawName, rawQty]) => {
        const name = (rawName || "").toString().trim();
        const qty = parseQty(rawQty);
        return { name, qty };
      })
      .filter((it) => it.name && it.qty > 0);
  }
  return [];
}

/** --- 겹침 판정: [aStart,aEnd) vs [bStart,bEnd) (끝은 배타) */
function overlaps(aStart, aEnd, bStart, bEnd) {
  return (aStart < bEnd) && (bStart < aEnd);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Only POST allowed" });
  }

  try {
    const { rentalDate, returnDate, items = [] } = req.body || {};

    // ✅ 요청 윈도우를 시간 단위로 정규화
    const reqWin = normalizeRequestWindow(rentalDate, returnDate);
    if (!reqWin) {
      return res.status(400).json({ ok: false, error: "Invalid rental/return datetime format" });
    }
    const { start: reqStart, end: reqEnd } = reqWin;

    const reqItems = normalizeItems(items);
    if (!reqItems.length) {
      return res.status(400).json({ ok: false, error: "No items" });
    }

    // --- 승인된 예약만 집계 ---
    const snap = await db.collection("rental_requests").get();

    // 품목별 기존 점유 수량(요청 구간과 겹치는 것만)
    const usedByItem = new Map(); // key: 품목 -> 누적 수량

    snap.forEach((doc) => {
      const d = doc.data();
      if (!isApprovedStatus(d?.status)) return;

      // DB에 저장된 필드에서 시작/끝을 시간단위로 파싱
      // rentalDateTime / returnDateTime이 "YYYY-MM-DD HH-HH" 형식이라면 정확히 처리됨
      // 과거 데이터가 "YYYY-MM-DD"만 있을 수도 있으므로 parseKSTRange가 커버함
      const rStart = parseKSTRange(d?.rentalDateTime || d?.rentalDate || d?.startDate);
      const rEnd   = parseKSTRange(d?.returnDateTime || d?.returnDate || d?.endDate);
      if (!rStart || !rEnd) return;

      const aStart = rStart.start;
      const aEnd   = rEnd.end ?? rEnd.start; // end가 없으면 start 사용

      if (!overlaps(reqStart, reqEnd, aStart, aEnd)) return;

      const list = normalizeItems(d?.items || d?.rentalItems || d?.itemsObject);
      if (!list.length) return;

      for (const { name, qty } of list) {
        usedByItem.set(name, (usedByItem.get(name) || 0) + qty);
      }
    });

    // --- 요청과 비교: 품목 단위로 검증 ---
    const conflicts = [];
    for (const { name, qty } of reqItems) {
      const limit = ITEM_LIMITS[name] ?? 0; // 등록되지 않은 품목은 0으로 처리
      const reserved = usedByItem.get(name) || 0;
      const available = Math.max(0, limit - reserved);

      if (reserved + qty > limit) {
        conflicts.push({
          item: name,
          reserved,
          limit,
          requested: qty,
          available,
          // 디버깅을 위해 사람이 읽을 수 있게 요청 구간도 리턴
          requestWindowKST: {
            startISO: reqStart.toISOString(),
            endISO: reqEnd.toISOString(),
          },
        });
      }
    }

    return res.status(200).json({
      ok: true,
      policy: "per-item-by-time-window", // 참고용: 시간 구간 기반
      available: conflicts.length === 0,
      conflicts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
