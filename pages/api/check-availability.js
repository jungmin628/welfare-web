// /pages/api/check-availability.js
import admin from "firebase-admin";

/** --- Firebase Admin 안전 초기화 (base64/JSON 모두 허용) --- */
function initAdmin() {
  if (admin.apps.length) return;

  let credsRaw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (!credsRaw) throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON is not set");

  // base64면 디코딩 시도, JSON이면 그대로 사용
  try {
    const decoded = Buffer.from(credsRaw, "base64").toString("utf8");
    JSON.parse(decoded);
    credsRaw = decoded;
  } catch (_) {
    // 이미 JSON 문자열인 경우 통과
  }

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
      .map((it) => ({
        name: it?.name || it?.itemName,
        qty: Number(it?.qty ?? it?.quantity ?? 0),
      }))
      .filter((it) => it.name && it.qty > 0);
  }
  if (items && typeof items === "object") {
    return Object.entries(items)
      .map(([name, qty]) => ({ name, qty: Number(qty) || 0 }))
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
    let approvedDocsCount = 0;

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

      approvedDocsCount++;

      for (const day of days) {
        for (const { name, qty } of list) {
          const key = `${day}__${name}`;
          reservedByDayItem.set(key, (reservedByDayItem.get(key) || 0) + qty);
        }
      }
    });

    // --- 요청과 비교: 날짜·품목 당 한 레코드 ---
    const conflicts = [];
    for (const day of reqDays) {
      for (const { name, qty } of reqItems) {
        const limit = ITEM_LIMITS[name] ?? Infinity;
        const reserved = reservedByDayItem.get(`${day}__${name}`) || 0;
        const available = Math.max(0, limit - reserved);

        if (reserved + qty > limit) {
          conflicts.push({
            date: day,            // YYYY-MM-DD
            item: name,           // 품목명
            reserved,             // 그 날 이미 예약된 총 수량
            limit,                // 보유 한도
            requested: qty,       // 이번 요청 수량
            available,            // 현재 잔여(요청 전)
          });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      policy: "per-item-per-day", // 참고용
      approvedDocsCount,
      available: conflicts.length === 0,
      conflicts, // 항상 같은 스키마(date,item,reserved,limit,requested,available)
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
