// /pages/api/check-availability.js
import admin from "firebase-admin";

/** --- Firebase Admin 안전 초기화 --- */
function initAdmin() {
  if (admin.apps.length) return;
  let credsRaw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (!credsRaw) throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON is not set");

  try {
    const maybeDecoded = Buffer.from(credsRaw, "base64").toString("utf8");
    JSON.parse(maybeDecoded);
    credsRaw = maybeDecoded;
  } catch (_) { /* 이미 JSON 문자열이면 통과 */ }

  const serviceAccount = JSON.parse(credsRaw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
initAdmin();

const db = admin.firestore();

/** --- 품목별 최대 수량 (프론트와 반드시 일치!) --- */
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

function extractDateStr(dateTimeStr) {
  // "2025-08-11 14-15" -> "2025-08-11"
  if (!dateTimeStr) return null;
  return String(dateTimeStr).split(" ")[0];
}
function parseYMD(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function expandDatesInclusive(startYMD, endYMD) {
  const start = parseYMD(startYMD);
  const end = parseYMD(endYMD);
  const out = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
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
    const { rentalDate, returnDate, items } = req.body || {};
    if (!rentalDate || !returnDate || !Array.isArray(items)) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    const reqStartYMD = extractDateStr(rentalDate);
    const reqEndYMD = extractDateStr(returnDate);
    if (!reqStartYMD || !reqEndYMD) {
      return res.status(400).json({ ok: false, error: "Invalid date format" });
    }
    const reqDays = expandDatesInclusive(reqStartYMD, reqEndYMD);

    // 날짜별·품목별 승인 대여 수량 누적 맵: used[day][item] = 총합 qty
    const used = Object.create(null);

    const snap = await db
      .collection("rental_requests")
      .where("status", "==", "approved")
      .get();

    snap.forEach((doc) => {
      const data = doc.data();
      const aStart = extractDateStr(data.rentalDate);
      const aEnd = extractDateStr(data.returnDate);
      const aItems = Array.isArray(data.items) ? data.items : [];
      if (!aStart || !aEnd) return;

      const aDays = expandDatesInclusive(aStart, aEnd);
      for (const day of aDays) {
        if (!used[day]) used[day] = Object.create(null);
        for (const it of aItems) {
          const name = it?.name;
          const qty = Number(it?.qty) || 0;
          if (!name || qty <= 0) continue;
          used[day][name] = (used[day][name] || 0) + qty;
        }
      }
    });

    // 요청 품목에 대해 날짜별 잔여 수량 계산 & 부족 여부 판단
    const conflicts = [];
    const remainingByDay = {}; // 디버깅/표시용 (선택)

    for (const day of reqDays) {
      const usedOnDay = used[day] || {};
      remainingByDay[day] = {};

      for (const req of items) {
        const name = req?.name;
        const reqQty = Number(req?.qty) || 0;
        if (!name || reqQty <= 0) continue;

        const limit = ITEM_LIMITS[name];
        if (typeof limit !== "number") {
          // 등록되지 않은 품목은 0개로 취급(또는 Infinity로 허용하고 싶다면 바꾸세요)
          conflicts.push({ item: name, date: day, reason: "unknown-item", required: reqQty, remaining: 0 });
          continue;
        }

        const already = usedOnDay[name] || 0;
        const remaining = Math.max(0, limit - already);
        remainingByDay[day][name] = remaining;

        if (reqQty > remaining) {
          conflicts.push({
            item: name,
            date: day,
            required: reqQty,
            remaining,
            limit,
            alreadyReserved: already,
          });
        }
      }
    }

    if (conflicts.length) {
      return res.status(200).json({
        ok: true,
        available: false,
        policy: "per-item-quantity",
        conflicts,         // 날짜·품목별로 얼마나 부족한지
        // remainingByDay,  // 필요하면 주석 해제해서 프론트에서 잔여 보여주기
      });
    }

    return res.status(200).json({
      ok: true,
      available: true,
      policy: "per-item-quantity",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
