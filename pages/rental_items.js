// pages/rental_items.js
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function RentalItemsPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const items = [
      { name: "천막", max: 10 },
      { name: "천막 가림막", max: 3 },
      { name: "테이블", max: 16 },
      { name: "의자", max: 30 },
      { name: "행사용 앰프", max: 1 },
      { name: "이동용 앰프", max: 1 },
      { name: "리드선 50m", max: 2 },
      { name: "리드선 30m", max: 2 },
      { name: "운반기 대형", max: 1 },
      { name: "운반기 소형", max: 1 },
      { name: "운반기 L카트", max: 1 },
      { name: "아이스박스 70L", max: 1 },
      { name: "아이스박스 50L", max: 2 },
      { name: "무전기", max: 6 },
      { name: "확성기", max: 6 },
      { name: "명찰", max: 80 },
      { name: "이젤", max: 5 },
      { name: "돗자리", max: 9 },
      { name: "1인용 돗자리", max: 96 },
      { name: "목장갑", max: 69 },
      { name: "줄다리기 줄 15m", max: 1 },
      { name: "줄다리기 줄 25m", max: 1 },
      { name: "중형 화이트보드", max: 1 },
    ];
    setInventory(items);
  }, []);

  const handleChange = (name, value) => {
    const intValue = Math.max(0, Math.min(Number(value) || 0, getMax(name)));
    setQuantities((prev) => ({ ...prev, [name]: intValue }));
  };

  const getMax = (name) => {
    const found = inventory.find((i) => i.name === name);
    return found?.max ?? Infinity;
  };

  const increaseQty = (name, max) => {
    setQuantities((prev) => {
      const current = prev[name] || 0;
      if (max !== undefined && current >= max) return prev;
      return { ...prev, [name]: current + 1 };
    });
  };

  const decreaseQty = (name) => {
    setQuantities((prev) => {
      const current = prev[name] || 0;
      if (current <= 0) return prev;
      return { ...prev, [name]: current - 1 };
    });
  };

  const itemsArray = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([_, qty]) => (qty || 0) > 0)
        .map(([name, qty]) => ({ name, qty })),
    [quantities]
  );

  const handleSubmit = async () => {
    const rentalDate = typeof window !== "undefined" && localStorage.getItem("rentalDateTime"); // "YYYY-MM-DD HH-HH"
    const returnDate = typeof window !== "undefined" && localStorage.getItem("returnDateTime"); // "YYYY-MM-DD HH-HH"

    if (!rentalDate || !returnDate) {
      alert("날짜를 먼저 선택해주세요.");
      return;
    }
    if (itemsArray.length === 0) {
      alert("1개 이상의 물품을 선택해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalDate, returnDate, items: itemsArray }),
      });

      if (!res.ok) {
        // 텍스트로 먼저 읽고 메시지 표시
        const text = await res.text();
        throw new Error(`API ${res.status} ${res.statusText}: ${text || "(no body)"}`);
      }

      const result = await res.json();

      if (!result.ok) {
        alert("오류가 발생했습니다: " + (result.error || "알 수 없는 오류"));
        return;
      }

      if (result.available) {
        const rentalItemsObj = Object.fromEntries(itemsArray.map(i => [i.name, i.qty]));
        localStorage.setItem("rentalItems", itemsArray.map(i => `${i.name}: ${i.qty}`).join("\n"));
        localStorage.setItem("rentalItemsObject", JSON.stringify(rentalItemsObj));

        alert("✅ 재고가 남아있습니다! 확인 후 물품신청서를 작성해주세요.");
        router.push("/submit");
      } else {
        const msg = (result.conflicts || [])
          .map((c) => `- ${c.date}에 ${c.item} 이미 예약됨`)
          .join("\n");
        alert(`❌ 대여 불가\n같은 날짜에 동일 품목 예약이 존재합니다.\n${msg}`);
      }
    } catch (e) {
      console.error(e);
      alert(`네트워크/서버 오류: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head><title>대여 물품 선택</title></Head>

      <div className="container">
        <h2 className="page-title">📦 대여 물품 선택</h2>
        <h5>
          지정된 최대 갯수를 초과하여 대여 원할 경우, <br />
          우선 최대 갯수로 신청하시고 부위원장에게 따로 연락 바랍니다.
        </h5>

        <div className="item-list">
          {inventory.map(({ name, max }) => (
            <div key={name} className="item-card">
              <label htmlFor={name} className="item-label">
                {name}{max ? ` (최대 ${max}개)` : ""}
              </label>
              <div className="item-control">
                <button type="button" onClick={() => decreaseQty(name)} disabled={submitting}>-</button>
                <input
                  type="number"
                  id={name}
                  min="0"
                  max={max}
                  value={quantities[name] || 0}
                  onChange={(e) => handleChange(name, e.target.value)}
                  disabled={submitting}
                />
                <button type="button" onClick={() => increaseQty(name, max)} disabled={submitting}>+</button>
                <span className="unit">개</span>
              </div>
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="btn submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "확인 중..." : "다음"}
          </button>
          <button className="btn back-btn" onClick={() => router.back()} disabled={submitting}>
            이전
          </button>
        </div>

        <p className="contact-info">
          문의사항이 생길 시, <br />
          부위원장 이정민 : 010-9426-1027 에게 연락바랍니다.
        </p>
      </div>

      <style jsx>{`
        .container { max-width: 600px; margin: 40px auto; background: #f4f4ff; padding: 20px; border-radius: 12px; box-shadow: 0 0 8px rgba(0,0,0,0.1); }
        .page-title { text-align: center; color: #4a54e1; margin-bottom: 20px; }
        .item-list { display: flex; flex-direction: column; gap: 15px; }
        .item-card { background: white; padding: 12px 16px; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
        .item-label { display: block; font-weight: 600; margin-bottom: 8px; }
        .item-control { display: flex; align-items: center; gap: 8px; }
        .item-control input { width: 60px; text-align: center; padding: 8px; font-size: 15px; border: 1px solid #ccc; border-radius: 6px; }
        .item-control button { background: #ddd; border: none; padding: 6px 12px; border-radius: 6px; font-size: 18px; font-weight: bold; cursor: pointer; }
        .item-control .unit { font-size: 14px; color: #555; }
        .button-group { display: flex; flex-direction: column; align-items: center; margin-top: 30px; gap: 5px; }
        .btn { width: 120px; height: 48px; padding: 0; font-size: 16px; font-weight: bold; text-align: center; line-height: 48px; border: none; border-radius: 8px; box-sizing: border-box; cursor: pointer; display: inline-block; }
        .submit-btn { background: #4a54e1; color: white; }
        .back-btn { background: #ccc; color: #333; }
        h5 { text-align: center; }
        .contact-info { margin-top: 20px; font-size: 14px; color: #555; text-align: center; }
      `}</style>
    </>
  );
}
