// /pages/api/rental/schedule.js
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";

const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_JSON);
if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

export default async function handler(req, res) {
  try {
    const snapshot = await db
      .collection("rental_requests")
      .where("status", "==", "approved")
      .get();

    const events = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const { rentalDate, returnDate, items } = data;

      const startISO = toKSTISO(rentalDate);   // ▼ 변경
      const endISO   = toKSTISO(returnDate);   // ▼ 변경

      if (startISO && endISO && items && typeof items === "object") {
        const title = Object.entries(items)
          .map(([name, count]) => `${name}(${count})`)
          .join(" · ");

        events.push({
          id: doc.id,
          title,
          start: startISO,     // "YYYY-MM-DDTHH:mm:00+09:00"
          end: endISO,         // "
          allDay: false,       // ▼ 시간 이벤트로 표시 (중요!)
        });
      } else {
        console.warn(`❗ 잘못된 데이터 - ID: ${doc.id}`, data);
      }
    });

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("🔥 schedule API error:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
}

/**
 * "YYYY-MM-DD HH:mm" 또는 "YYYY-MM-DD HH-mm" 또는 "YYYY-MM-DD HH"
 * 형태를 안전하게 KST ISO로 변환
 * 예) "2025-08-11 10-11" -> "2025-08-11T10:11:00+09:00"
 */
function toKSTISO(input) {
  if (!input) return null;

  // Firestore Timestamp인 경우
  if (typeof input === "object" && input.toDate) {
    const d = input.toDate();
    return toISOWithOffset(d, 9);
  }

  if (typeof input !== "string") return null;

  const [datePart, rawTime = "00:00"] = input.trim().split(" ");

  // "10-11" -> "10:11", "10" -> "10:00"
  let time = rawTime.includes("-") ? rawTime.replace("-", ":") : rawTime;
  if (/^\d{1,2}$/.test(time)) time = `${time}:00`;

  // 두 자리 보정
  const [hh = "00", mm = "00"] = time.split(":");
  const HH = String(hh).padStart(2, "0");
  const MM = String(mm).padStart(2, "0");

  return `${datePart}T${HH}:${MM}:00+09:00`;
}

/** Date 객체를 지정 오프셋(시간) ISO(+09:00 등)로 */
function toISOWithOffset(date, offsetHours = 0) {
  // 로컬 시간을 그대로 쓰고, 표기만 +09:00로 붙이기
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  const sign = offsetHours >= 0 ? "+" : "-";
  const abs = String(Math.abs(offsetHours)).padStart(2, "0");
  return `${y}-${m}-${d}T${hh}:${mm}:${ss}${sign}${abs}:00`;
}
