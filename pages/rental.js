// pages/rental.js
import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function RentalPage() {
  const gridRef = useRef(null);
  const labelRef = useRef(null);
  const nextBtnRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const holidays = [
    "2025-01-01", "2025-03-01", "2025-05-05", "2025-06-06",
    "2025-08-15", "2025-09-10", "2025-10-03", "2025-12-25"
  ];

  const renderCalendar = () => {
    const grid = gridRef.current;
    const label = labelRef.current;
    if (!grid || !label) return;

    grid.innerHTML = "";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    label.textContent = `${year}년 ${month + 1}월`;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell empty";
      cell.textContent = "";
      grid.appendChild(cell);
    }

    for (let d = 1; d <= lastDate; d++) {
      const cell = document.createElement("div");
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dateObj = new Date(dateStr);

      const isPast = dateObj < today;
      const isHoliday = holidays.includes(dateStr);
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      cell.className = "calendar-cell";
      if (isPast || isHoliday || isWeekend) {
        cell.classList.add("disabled");
      } else {
        cell.onclick = () => {
          setSelectedDate(dateStr);
          localStorage.setItem("rentalDate", dateStr);
          document.querySelectorAll(".calendar-cell").forEach(c => c.classList.remove("selected"));
          cell.classList.add("selected");
          document.getElementById("selectedDate").textContent = `선택된 날짜: ${dateStr}`;
          nextBtnRef.current.style.display = "block";
        };
      }

      cell.textContent = d;
      if (selectedDate === dateStr) {
        cell.classList.add("selected");
      }

      grid.appendChild(cell);
    }
  };

  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + offset);
    newMonth.setDate(1);
    setCurrentMonth(newMonth);
  };

  useEffect(() => {
    const saved = localStorage.getItem("rentalDate");
    if (saved) setSelectedDate(saved);
  }, []);

  useEffect(() => {
    renderCalendar();
  }, [currentMonth, selectedDate]);

  return (
    <>
      <Head>
        <title>대여일 선택</title>
      </Head>

      <div className="calendar">
        <h2 className="title">📅 대여일 선택</h2>
        <h6 className="title" > 주말, 공휴일은 선택할 수 없습니다. 행사 시작 전 평일로 선택해주세요. </h6>
        <div className="calendar-controls">
          <button onClick={() => changeMonth(-1)}>← 이전</button>
          <span ref={labelRef}></span>
          <button onClick={() => changeMonth(1)}>다음 →</button>
        </div>
        <div className="calendar-grid" ref={gridRef}></div>
        <p id="selectedDate">선택된 날짜: 없음</p>
        <Link
          href="/return"
          className="next-btn"
          ref={nextBtnRef}
          style={{ display: selectedDate ? "block" : "none" }}
        >
          다음
        </Link>
      </div>

      <style jsx>{`
        .calendar {
          background: #f4f4ff;
          max-width: 420px;
          margin: 40px auto;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .title {
          text-align: center;
          margin-bottom: 16px;
        }
        .calendar-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .calendar-controls button {
          background: #7b68ee;
          color: #fff;
          border: none;
          padding: 6px 12px;
          border-radius: 5px;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 5px;
        }
        .calendar-cell {
          padding: 12px 0;
          text-align: center;
          background: #f0f0f0;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
        }
        .calendar-cell.empty {
          background: transparent;
        }
        .calendar-cell.disabled {
          background: #e0e0e0;
          color: #aaa;
          cursor: not-allowed;
        }
        .calendar-cell.selected {
          background: #4a54e1;
          color: white;
        }
        .next-btn {
          display: block;
          margin: 20px auto 0;
          text-align: center;
          background: #4a54e1;
          color: #fff;
          padding: 10px;
          border-radius: 10px;
          text-decoration: none;
        }
      `}</style>
    </>
  );
}
