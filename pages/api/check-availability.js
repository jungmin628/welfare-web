// /pages/api/checkAvailability.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS_JSON);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

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
  if (req.method !== "POST") {
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

    // 승인된 예약만 가져와 메모리에서 날짜 비교
    const snap = await db.collection("rental_requests")
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

    if (conflicts.length) {
      return res.status(200).json({
        ok: true,
        available: false,
        policy: "daily-exclusive",
        conflicts,
      });
    }

    return res.status(200).json({
      ok: true,
      available: true,
      policy: "daily-exclusive",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
