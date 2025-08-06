// pages/rental_items.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function RentalItemsPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    const items = [
      { name: "천막", max: 5 },
      { name: "천막 가림막" },
      { name: "테이블", max: 16 },
      { name: "의자" },
      { name: "행사용 앰프", max: 1 },
      { name: "이동용 앰프", max: 1 },
      { name: "리드선 50m", max: 2 },
      { name: "리드선 30m", max: 2 },
      { name: "운반기 대형", max: 1 },
      { name: "운반기 소형", max: 1 },
      { name: "운반기 L카트", max: 1 },
      { name: "아이스박스 70L" },
      { name: "아이스박스 50L" },
      { name: "무전기" },
      { name: "확성기" },
      { name: "명찰" },
      { name: "이젤" },
      { name: "돗자리" },
      { name: "1인용 돗자리" },
      { name: "목장갑" },
      { name: "줄다리기 줄 15m" },
      { name: "줄다리기 줄 25m" },
      { name: "중형 화이트보드" }
    ];
    setInventory(items);
  }, []);

  const handleChange = (name, value) => {
    setQuantities(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleSubmit = async () => {
    const rentalDate = localStorage.getItem("rentalDate");
    const returnDate = localStorage.getItem("returnDate");
    if (!rentalDate || !returnDate) {
      alert("날짜를 먼저 선택해주세요.");
      return;
    }

    const rentalItems = {};
    Object.entries(quantities).forEach(([name, qty]) => {
      if (qty > 0) rentalItems[name] = qty;
    });

    if (Object.keys(rentalItems).length === 0) {
      alert("1개 이상의 물품을 선택해주세요.");
      return;
    }

    const res = await fetch("/api/check-availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rentalDate, returnDate, rentalItems })
    });

    const result = await res.json();

    if (result.available) {
      localStorage.setItem("rentalItems", Object.entries(rentalItems).map(([k, v]) => `${k}: ${v}`).join("\n"));
      localStorage.setItem("rentalItemsObject", JSON.stringify(rentalItems));
      alert("✅ 재고가 남아있습니다! 확인 버튼을 누른 후, 물품신청서를 작성해주세요.");
      router.push("/submit");
    } else {
      alert(`❌ ${result.item || '일부 항목'}의 재고가 부족합니다. 다른 일정을 선택해주세요.`);
    }
  };

  return (
    <>
      <Head><title>대여 물품 선택</title></Head>
      <div className="container">
        <h2 className="page-title">📦 대여 물품 선택</h2>

        <div className="item-list">
          {inventory.map(({ name, max }) => (
            <div key={name} className="item-card">
              <label htmlFor={name} className="item-label">
                {name}{max ? ` (최대 ${max}개)` : ''}
              </label>
              <input
                type="number"
                id={name}
                className="item-input"
                min="0"
                max={max}
                value={quantities[name] || 0}
                onChange={(e) => handleChange(name, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="btn submit-btn" onClick={handleSubmit}>다음</button>
          <button className="btn back-btn" onClick={() => router.back()}>이전</button>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #f4f4ff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        }
        .page-title {
          text-align: center;
          color: #4a54e1;
          margin-bottom: 20px;
        }
        .item-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .item-card {
          background: white;
          padding: 12px 16px;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        }
        .item-label {
          display: block;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .item-input {
          width: 100%;
          padding: 10px;
          font-size: 15px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        .button-group {
          display: flex;
          justify-content: center;
          margin-top: 30px;
          gap: 12px;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          font-size: 15px;
          cursor: pointer;
        }
        .submit-btn {
          background: #4a54e1;
          color: white;
        }
        .back-btn {
          background: #ccc;
          color: #333;
        }
      `}</style>
    </>
  );
}
