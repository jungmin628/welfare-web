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
  "천막": 10,
  "천막 가림막": 3,
  "테이블": 16,
  "의자": 30,
  "행사용 앰프": 1,
  "이동용 앰프": 1,
  "리드선 50m": 2,
  "리드선 30m": 2,
  "운반기 대형": 1,
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

/** --- 수량 파서: "3개", " 7 ", 7, "x3" 등에서 정수 추출 --- */
function parseQty(val) {
  if (val == null) return 0;
  if (typeof val === "number" && Number.isFinite(val)) return Math.max(0, Math.trunc(val));
  if (typeof val === "string") {
    const m = val.match(/(\d+)/); // 첫 번째 정수 추출
    if (m) return Math.max(0, parseInt(m[1], 10));
    return 0;
  }
  return 0;
}

/** --- 헬퍼: 문자열에서 날짜(YYYY-MM-DD)만 뽑기 --- */
function dateOnlyAny(input) {
  if (!input) return null;
  const s = String(input);

  // "YYYY-MM-DD HH-HH"
  let m = s.match(/^(\d{4}-\d{2}-\d{2})\s+\d{1,2}-\d{1,2}$/);
  if (m) return m[1];

  // ISO "YYYY-MM-DDTHH:mm..."
  m = s.match(/^(\d{4}-\d{2}-\d{2})T\d{2}:\d{2}/);
  if (m) return m[1];

  // 날짜만
  m = s.match(/^(\d{4}-\d{2}-\d{2})$/);
  if (m) return m[1];

  return null;
}

/** --- 헬퍼: 날짜 구간(포함) 배열 --- */
function eachDayInclusive(startYMD, endYMD) {
  const [y1, m1, d1] = startYMD.split("-").map(Number);
  const [y2, m2, d2] = endYMD.split("-").map(Number);
  const s = new Date(y1, m1 - 1, d1);
  const e = new Date(y2, m2 - 1, d2);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);

  const out = [];
  for (let dt = new Date(s); dt <= e; dt.setDate(dt.getDate() + 1)) {
    out.push(dt.toISOString().slice(0, 10));
  }
  return out;
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
    const start = dateOnlyAny(rentalDate);
    const end = dateOnlyAny(returnDate);

    if (!start || !end || !Array.isArray(items)) {
      return res.status(400).json({ ok: false, error: "Missing or invalid fields" });
    }

    const reqDays = eachDayInclusive(start, end);
    const reqItems = normalizeItems(items);

    // --- 승인된 예약만 집계 ---
    const snap = await db.collection("rental_requests").get();

    // 날짜·품목별 기존 예약 합계
    const reservedByDayItem = new Map(); // key: YYYY-MM-DD__품목 -> 수량 합계

    snap.forEach((doc) => {
      const d = doc.data();
      if (!isApprovedStatus(d?.status)) return;

      const s = dateOnlyAny(d?.rentalDateTime || d?.rentalDate || d?.startDate);
      const e = dateOnlyAny(d?.returnDateTime || d?.returnDate || d?.endDate);
      if (!s || !e) return;

      const days = eachDayInclusive(s, e);
      const list = normalizeItems(d?.items || d?.rentalItems || d?.itemsObject);
      if (!list.length) return;

      for (const day of days) {
        for (const { name, qty } of list) {
          const key = `${day}__${name}`;
          reservedByDayItem.set(key, (reservedByDayItem.get(key) || 0) + qty);
        }
      }
    });

    // --- 요청과 비교: 날짜·품목 단위로 검증 ---
    const conflicts = [];
    for (const day of reqDays) {
      for (const { name, qty } of reqItems) {
        const limit = ITEM_LIMITS[name] ?? 0; // 등록되지 않은 품목은 0으로 처리
        const reserved = reservedByDayItem.get(`${day}__${name}`) || 0;
        const available = Math.max(0, limit - reserved);

        if (reserved + qty > limit) {
          conflicts.push({
            date: day,
            item: name,
            reserved,
            limit,
            requested: qty,
            available,
          });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      policy: "per-item-per-day",
      available: conflicts.length === 0,
      conflicts,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
