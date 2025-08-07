import { db } from "../../lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// 품목별 최대 수량 정의
const ITEM_LIMITS = {
  "천막": 10,
  "테이블": 16,
  "행사용 앰프": 1,
  "이동용 앰프": 1,
  "리드선 50m": 2,
  "리드선 30m": 2,
  "운반기 대형": 1,
  "운반기 소형": 1,
  "운반기 L카트": 1,
  "천막 가림막": 3, // ✅ 필요한 품목 수량 반드시 포함!
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { rentalDate, returnDate, rentalItems } = req.body;

  try {
    const q = query(collection(db, "rental_requests"), where("status", "==", "approved"));
    const snapshot = await getDocs(q);

    const overlapMap = {}; // 날짜별 재고 누적 { '2025-08-25': { '천막': 2, ... }, ... }

    // 승인된 모든 대여 요청의 날짜별 품목 수량 누적
    snapshot.forEach(doc => {
      const data = doc.data();
      const start = new Date(data.rentalDate);
      const end = new Date(data.returnDate);
      const items = data.items || {};

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        if (!overlapMap[dateStr]) overlapMap[dateStr] = {};

        Object.entries(items).forEach(([name, qty]) => {
          overlapMap[dateStr][name] = (overlapMap[dateStr][name] || 0) + qty;
        });
      }
    });

    // 새 신청 요청이 각 날짜에 대해 품목별 최대 수량을 초과하는지 확인
    for (const [name, requestedQty] of Object.entries(rentalItems)) {
      const max = ITEM_LIMITS[name] || Infinity;

      for (
        let d = new Date(rentalDate);
        d <= new Date(returnDate);
        d.setDate(d.getDate() + 1)
      ) {
        const dateStr = d.toISOString().split("T")[0];
        const alreadyReserved = (overlapMap[dateStr]?.[name]) || 0;

        if (alreadyReserved + requestedQty > max) {
          return res.status(200).json({
            available: false,
            item: name,
            date: dateStr,
            reserved: alreadyReserved,
            requested: requestedQty,
            max,
          });
        }
      }
    }

    // 모든 날짜 확인 통과 → 대여 가능
    return res.status(200).json({ available: true });
  } catch (error) {
    console.error("재고 확인 실패:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
