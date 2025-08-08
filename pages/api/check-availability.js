// /pages/api/check-availability.js
import admin from "firebase-admin";

/** --- Firebase Admin 안전 초기화 --- */
function initAdmin() {
  if (admin.apps.length) return;
  let credsRaw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;

  if (!credsRaw) {
    throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON is not set");
  }

  // 혹시 Base64 로 넣어뒀으면 복원
  try {
    // JSON이 그대로 들어온 경우는 여기서 실패하지 않음
    // Base64 로 들어온 경우만 atob 유사 처리
    const maybeDecoded = Buffer.from(credsRaw, "base64").toString("utf8");
    // decoded 가 진짜 JSON이면 교체
    JSON.parse(maybeDecoded);
    credsRaw = maybeDecoded;
  } catch (_) {
    // 그냥 JSON 문자열로 들어온 케이스면 그대로 사용
  }

  const serviceAccount = JSON.parse(credsRaw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
initAdmin();

const db = admin.firestore();

/** --- 유틸 --- */
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

/**
 * req.body:
 * {
 *   rentalDate: "YYYY-MM-DD HH-HH",
 *   returnDate: "YYYY-MM-DD HH-HH",
 *   items: [{ name, qty }]
 * }
 */
export default async function handler(req, res) {
  // 프리플라이트 허용 (혹시 모를 405 방지)
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

    // 승인된 예약만 조회
    const snap = await db
      .collection("rental_requests")
      .where("status", "==", "approved")
      .get();

    const approvedItemDaySet = new Set();
    snap.forEach((doc) => {
      const data = doc.data();
      const aStart = extractDateStr(data.rentalDate);
      const aEnd = extractDateStr(data.returnDate);
      const aItems = Array.isArray(data.items) ? data.items : [];
      if (!aStart || !aEnd) return;

      const aDays = expandDatesInclusive(aStart, aEnd);
      for (const it of aItems) {
        const name = it?.name;
        if (!name) continue;
        for (const day of aDays) {
          approvedItemDaySet.add(`${name}::${day}`);
        }
      }
    });

    const conflicts = [];
    for (const it of items) {
      const name = it?.name;
      if (!name) continue;
      for (const day of reqDays) {
        if (approvedItemDaySet.has(`${name}::${day}`)) {
          conflicts.push({ item: name, date: day });
        }
      }
    }

    return res.status(200).json({
      ok: true,
      available: conflicts.length === 0,
      policy: "daily-exclusive",
      ...(conflicts.length ? { conflicts } : {}),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
