// /pages/schedule.js
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import Link from "next/link";

export default function SchedulePage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch('/api/rental/schedule');
      const data = await res.json();
      if (data.success) setEvents(data.events);
    };
    fetchEvents();
  }, []);

  const renderEventContent = (info) => (
    <div style={eventBoxStyle}>
      {/* 시간표시 */}
      <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>{info.timeText}</div>
      {/* 타이틀 */}
      <div>{info.event.title}</div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>📅 학생복지위원회 대여 일정</h2>
      <h5 style={{ textAlign: 'center', marginBottom: '20px' }}>
        달력이 잘 나오지 않을 경우, 새로고침 해주세요.
      </h5>

      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ start: 'today', center: 'title', end: 'prev,next' }}
        events={events}
        eventContent={renderEventContent}
        height="auto"
        displayEventEnd={true}           // ⬅️ 종료시간도 표시
        eventTimeFormat={{               // ⬅️ 24시간 HH:mm
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false
        }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false }}
      />

      <Link href="/rental" className="next-btn">대여신청하러 가기</Link>
      <Link href="/" className="next-btn">메인으로</Link>
    </div>
  );
}

// 스타일은 기존 그대로…
const containerStyle = { maxWidth:'900px', margin:'40px auto', padding:'30px', backgroundColor:'#f9f9ff', borderRadius:'20px', boxShadow:'0 0 15px rgba(0,0,0,0.1)' };
const titleStyle = { fontSize:'24px', textAlign:'center', marginBottom:'10px', color:'#546fff', fontWeight:'600' };
const eventBoxStyle = { backgroundColor:'#546fff', color:'white', padding:'3px 6px', borderRadius:'6px', fontSize:'0.75rem', marginTop:'4px', whiteSpace:'normal', wordWrap:'break-word', lineHeight:'1.3', fontWeight:'500' };
