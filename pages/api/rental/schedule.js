import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import serviceAccount from "../../../firebase/welfare-website-firebase-adminsdk-fbsvc-13991244b1.json";

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
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

      const start = parseDate(rentalDate);
      const end = parseDate(returnDate);

      if (start && end && items && typeof items === "object") {
        const title = Object.entries(items)
          .map(([name, count]) => `${name}(${count})`)
          .join(", ");

        events.push({
          title,
          start: start.toISOString(),
          end: end.toISOString(),
          allDay: true,
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

// 날짜 문자열 또는 Firestore Timestamp → Date 객체 변환
function parseDate(input) {
  if (!input) return null;

  if (typeof input === "object" && input.toDate) {
    return input.toDate();
  }

  const fixed = input.replace(/(\d{2})-(\d{2})$/, "$1:$2");
  const date = new Date(fixed);
  return isNaN(date.getTime()) ? null : date;
}
