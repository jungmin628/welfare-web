import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ReturnPage() {
  const gridRef = useRef(null);
  const labelRef = useRef(null);
  const nextBtnRef = useRef(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  useEffect(() => {
  alert(
    "📢 대여는 행사 시작 전날 또는 당일에만 가능합니다. 이전에는 대여가 불가능합니다. \n 📢 신청한 대여시간을 꼭 준수해주시기 바랍니다. 차후 불이익이 생길 수 있습니다. "
  );
  
}, []);

  const holidays = [
    "2025-01-01", "2025-03-01", "2025-05-05", "2025-06-06",
    "2025-08-15", "2025-09-10", "2025-10-03", "2025-12-25"
  ];

  const timeSlots = ["10-11", "11-12", "12-13", "13-14", "14-15", "15-16", "16-17"];

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
      grid.appendChild(cell);
    }

    for (let d = 1; d <= lastDate; d++) {
      const cell = document.createElement("div");
      const dateObj = new Date(year, month, d);
      const formatted = formatDate(dateObj);

      const day = dateObj.getDay();
      const isPast = dateObj < today;
      const isHoliday = holidays.includes(formatted);
      const isWeekend = day === 0 || day === 6;

      cell.className = "calendar-cell";

      if (isPast || isHoliday || isWeekend) {
        cell.classList.add("disabled");
      }
      if (isHoliday) cell.classList.add("holiday");
      if (day === 0) cell.classList.add("sunday");
      if (day === 6) cell.classList.add("saturday");

      const numberSpan = document.createElement("span");
      numberSpan.textContent = d;
      if (isHoliday || day === 0 || day === 6) {
        numberSpan.style.color = "red";
      }

      cell.appendChild(numberSpan);

      if (!isPast && !isHoliday && !isWeekend) {
        cell.onclick = () => {
          setSelectedDate(formatted);
          setSelectedTime(null);
          localStorage.setItem("returnDate", formatted);
          document.querySelectorAll(".calendar-cell").forEach(c => c.classList.remove("selected"));
          cell.classList.add("selected");
          document.getElementById("selectedDate").textContent = `선택된 날짜: ${formatted}`;
        };
      }

      if (selectedDate === formatted) {
        cell.classList.add("selected");
      }

      grid.appendChild(cell);
    }
  };

  const handleTimeSelect = (slot) => {
    setSelectedTime(slot);
    const fullDateTime = `${selectedDate} ${slot}`;
    localStorage.setItem("returnDateTime", fullDateTime);
    nextBtnRef.current.style.display = "block";
  };

  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + offset);
    newMonth.setDate(1);
    setCurrentMonth(newMonth);
  };

  useEffect(() => {
    const saved = localStorage.getItem("returnDate");
    const savedTime = localStorage.getItem("returnDateTime");
    if (saved) setSelectedDate(saved);
    if (savedTime) {
      const [, time] = savedTime.split(" ");
      setSelectedTime(time);
    }
  }, []);

  useEffect(() => {
    renderCalendar();
  }, [currentMonth, selectedDate]);

  return (
    <>
      <Head>
        <title>반납일 선택</title>
      </Head>

      <div className="calendar">
        <h2 className="title">📅 반납일 선택</h2>
        <h5 className="title">주말, 공휴일은 선택할 수 없습니다. 행사 종료 후 평일로 선택해주세요.</h5>
        <h5 className="title">대여/반납 시간을 반드시 준수 해주시기 바랍니다. </h5>
        <div className="calendar-controls">
          <button onClick={() => changeMonth(-1)}>← 이전</button>
          <span ref={labelRef}></span>
          <button onClick={() => changeMonth(1)}>다음 →</button>
        </div>

        <div className="calendar-header">
          <span className="day-label sunday">일</span>
          <span className="day-label">월</span>
          <span className="day-label">화</span>
          <span className="day-label">수</span>
          <span className="day-label">목</span>
          <span className="day-label">금</span>
          <span className="day-label saturday">토</span>
        </div>

        <div className="calendar-grid" ref={gridRef}></div>

        <p id="selectedDate">선택된 날짜: {selectedDate || "없음"}</p>

        {selectedDate && (
          <div className="time-slot-container">
            <h4>시간대 선택</h4>
            <div className="time-slot-buttons">
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  className={`time-slot-btn ${selectedTime === slot ? "selected-time" : ""}`}
                  onClick={() => handleTimeSelect(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}

        <Link
          href="/rental_items"
          className="next-btn"
          ref={nextBtnRef}
          style={{ display: selectedDate && selectedTime ? "block" : "none" }}
        >
          다음
        </Link>

        <p className="contact-info">
  문의사항이 생길 시, <br></br>부위원장 이정민 : 010-9426-1027 에게 연락바랍니다.
</p>
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

        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: bold;
          margin-bottom: 5px;
        }

        .day-label {
          padding: 10px 0;
          border-bottom: 1px solid #ccc;
        }

        .day-label.sunday {
          color: red;
        }
        .day-label.saturday {
          color: red;
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

        .time-slot-container {
          margin-top: 20px;
          text-align: center;
        }

        .time-slot-buttons {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-top: 10px;
        }

        .time-slot-btn {
          background: #ddd;
          padding: 8px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
        }

        .time-slot-btn:hover {
          background: #ccc;
        }

        .time-slot-btn.selected-time {
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

         .contact-info {
    margin-top: 20px;
    font-size: 14px;
    color: #555;
    text-align: center;
  }

  h5{
    text-align: center;
    color : #ce0018;
}
      `}</style>
    </>
  );
}
