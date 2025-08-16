// /pages/schedule.js
import React, { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";
import Link from "next/link";

export default function SchedulePage() {
  const [events, setEvents] = useState([]);

  // ▶ 탭/페이지 최초 진입 시 1회 자동 새로고침
  useEffect(() => {
    const KEY = "schedule_reloaded_once";
    if (typeof window !== "undefined" && !sessionStorage.getItem(KEY)) {
      sessionStorage.setItem(KEY, "1");
      window.location.reload();
    }
  }, []);

  // 일정 불러오기
  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch("/api/rental/schedule");
      const data = await res.json();
      if (data.success) setEvents(data.events);
    };
    fetchEvents();
  }, []);

  // 날짜/시간 포맷터
  const pad2 = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
  // 숫자만 반환하도록 (여기선 "시"를 붙이지 않음)
  const getHourNum = (d) => d.getHours();

  
    function pickDisplayHours(info) {
    const ext = info.event.extendedProps || {};
    let rentalStartHour = null;
    let returnEndHour = null;

    if (Number.isInteger(ext.rentalHourStart)) rentalStartHour = ext.rentalHourStart;
    if (Number.isInteger(ext.returnHourEnd))   returnEndHour  = ext.returnHourEnd;

    if (!rentalStartHour && typeof ext.rentalTimeRange === "string") {
      const m = ext.rentalTimeRange.match(/(\d{1,2})\s*[-~]\s*(\d{1,2})/);
      if (m) rentalStartHour = parseInt(m[1], 10);
    }
    if (!returnEndHour && typeof ext.returnTimeRange === "string") {
      const m = ext.returnTimeRange.match(/(\d{1,2})\s*[-~]\s*(\d{1,2})/);
      if (m) returnEndHour = parseInt(m[2], 10);
    }

    const s = info.event.start;
    const e = info.event.end || s;
    if (!Number.isInteger(rentalStartHour)) rentalStartHour = getHourNum(s);
    if (!Number.isInteger(returnEndHour))   returnEndHour   = getHourNum(e);

    return { rentalStartHour, returnEndHour, s, e };
  }
};

  // 커스텀 렌더: 날짜 / 시간 분리 노출
  const renderEventContent = (info) => {
    const s = info.event.start;
  const e = info.event.end || info.event.start;
  const dateText =
    fmtDate(s) === fmtDate(e) ? fmtDate(s) : `${fmtDate(s)} ~ ${fmtDate(e)}`;
  const timeText = `${fmtHour(s)}시 대여 / ${fmtHour(e)}시 반납`; // ← 여기서만 "시" 붙임

  return (
    <div style={eventBoxStyle}>
      <div style={{ fontSize: "0.72rem", opacity: 0.9 }}>날짜 | {dateText}</div>
      <div style={{ fontSize: "0.72rem", opacity: 0.9 }}>대여/반납 시간 | {timeText}</div>
      <div>{info.event.title}</div>
    </div>
    );
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>📅 학생복지위원회 대여 일정</h2>
      <h5 style={{ textAlign: "center", marginBottom: "20px" }}>
        달력이 잘 나오지 않을 경우, 새로고침 해주세요.
      </h5>

      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ start: "today", center: "title", end: "prev,next" }}
        events={events}
        eventContent={renderEventContent}
        height="auto"
        displayEventEnd={true}   // 종료시간까지 전달 받으면 표시
      />

      <Link href="/rental" className="next-btn">대여신청하러 가기</Link>
      <Link href="/" className="next-btn">메인으로</Link>
    </div>
  );


// 스타일(기존 유지)
const containerStyle = { maxWidth:'900px', margin:'40px auto', padding:'30px', backgroundColor:'#f9f9ff', borderRadius:'20px', boxShadow:'0 0 15px rgba(0,0,0,0.1)' };
const titleStyle = { fontSize:'24px', textAlign:'center', marginBottom:'10px', color:'#546fff', fontWeight:'600' };
const eventBoxStyle = { backgroundColor:'#546fff', color:'white', padding:'6px 8px', borderRadius:'6px', fontSize:'0.78rem', marginTop:'4px', whiteSpace:'normal', wordWrap:'break-word', lineHeight:'1.35', fontWeight:'500' };
