// pages/rental_items.js
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

export default function RentalItemsPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ 최초 로드 시 날짜 선택 여부 검증 (없으면 rental로 되돌림)
  useEffect(() => {
    const start = typeof window !== "undefined" && localStorage.getItem("rentalDateTime"); // 예: "2025-08-19 13-14"
    const end   = typeof window !== "undefined" && localStorage.getItem("returnDateTime"); // 예: "2025-08-20 15-16"
    if (!start || !end) {
      alert("대여/반납 날짜를 먼저 선택해주세요.");
      router.push("/rental");
      return;
    }
  }, [router]);

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

  const getMax = (name) => {
    const found = inventory.find((i) => i.name === name);
    return found?.max ?? Infinity;
  };

  const handleChange = (name, value) => {
    const n = Number(value);
    const intValue = Math.max(0, Math.min(Number.isFinite(n) ? n : 0, getMax(name)));
    setQuantities((prev) => ({ ...prev, [name]: intValue }));
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

  // 전송 페이로드: [{ name, qty }]
  const itemsArray = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([_, qty]) => (qty || 0) > 0)
        .map(([name, qty]) => ({ name, qty: Number(qty) })),
    [quantities]
  );

  // 서버가 돌려준 conflicts를 사용자 메시지로 요약
  function summarizeConflicts(conflicts = []) {
    if (!Array.isArray(conflicts) || conflicts.length === 0) return [];

    const map = new Map(); // date__item -> summary row
    for (const c of conflicts) {
      const date = c.date || c.day || c.when;
      const item = c.item || c.name;
      if (!date || !item) continue;

      const limit     = Number(c.limit ?? c.max ?? 0);
      const reserved  = Number(c.reserved ?? c.count ?? c.qty ?? 0);
      const requested = Number(c.requested ?? c.req ?? 0);
      const available = Number(c.available ?? (limit ? Math.max(0, limit - reserved) : 0));

      const key = `${date}__${item}`;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, { date, item, limit, reserved, requested, available });
      } else {
        prev.reserved  = Math.max(prev.reserved, reserved);
        prev.requested = Math.max(prev.requested, requested);
        prev.available = Math.min(prev.available, available);
        prev.limit     = prev.limit || limit;
      }
    }

    return Array.from(map.values()).map(
      (x) =>
        `${x.date} · ${x.item} (보유 ${x.limit}개, 이미 ${x.reserved}개 사용, 요청 ${x.requested}개 → 잔여 ${x.available}개)`
    );
  }

  const handleSubmit = async () => {
    const rentalDate = typeof window !== "undefined" && localStorage.getItem("rentalDateTime"); // "YYYY-MM-DD HH-HH"
    const returnDate = typeof window !== "undefined" && localStorage.getItem("returnDateTime"); // "YYYY-MM-DD HH-HH"

    if (!rentalDate || !returnDate) {
      alert("대여/반납 날짜를 먼저 선택해주세요.");
      router.push("/rental");
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
        const text = await res.text();
        throw new Error(`API ${res.status} ${res.statusText}: ${text || "(no body)"}`);
      }

      const result = await res.json();

      // ✅ 서버 응답 스키마 반영 (ok / available)
      if (!result.ok) {
        alert("오류가 발생했습니다: " + (result.error || "알 수 없는 오류"));
        return;
      }

      if (!result.available) {
        const lines = summarizeConflicts(result.conflicts || []);
        const body = lines.length ? `- ${lines.join("\n- ")}` : "(사유 정보를 불러오지 못했습니다)";
        alert(`❌ 대여 불가\n${body}`);
        return;
      }

      // 통과 → 다음 단계로 이동
      const rentalItemsObj = Object.fromEntries(itemsArray.map(i => [i.name, i.qty]));
      localStorage.setItem("rentalItems", itemsArray.map(i => `${i.name}: ${i.qty}`).join("\n"));
      localStorage.setItem("rentalItemsObject", JSON.stringify(rentalItemsObj));

      alert("✅ 재고가 남아있습니다! 확인 후 물품신청서를 작성해주세요.");
      router.push("/submit");
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
          <dl> ✅ 지정된 최대 갯수를 초과하여 대여 원할 경우, <br />우선 최대 갯수로 신청하시고 부위원장에게 따로 연락 바랍니다. </dl>
          <dl> ✅ 필요 수량만큼만 신청해주시기 바랍니다. </dl>
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
