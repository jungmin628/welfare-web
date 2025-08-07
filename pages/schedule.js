// /pages/schedule.js
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { useRouter } from 'next/router';

export default function SchedulePage() {
  const [events, setEvents] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch('/api/rental/schedule');
      const data = await res.json();
      if (data.success) {
        setEvents(data.events);
      }
    };
    fetchEvents();
  }, []);

  // 일정 스타일 커스터마이징
  const renderEventContent = (eventInfo) => {
    return (
      <div style={eventBoxStyle}>
        {eventInfo.event.title}
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      

      <h2 style={titleStyle}>📅 학생복지위원회 대여 일정</h2>
      <h5 style={{ textAlign: 'center', marginBottom: '20px' }}>
        달력이 잘 나오지 않을 경우, 새로고침 해주세요.
      </h5>

      <FullCalendar
        plugins={[dayGridPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          start: 'today',
          center: 'title',
          end: 'prev,next',
        }}
        events={events}
        eventContent={renderEventContent}
        height="auto"

      />

      <button style={buttonStyle} onClick={() => router.push('/')}>메인으로</button>
    </div>
  );
}

// 🟦 스타일 객체
const containerStyle = {
  maxWidth: '900px',
  margin: '40px auto',
  padding: '30px',
  backgroundColor: '#f9f9ff',
  borderRadius: '20px',
  boxShadow: '0 0 15px rgba(0,0,0,0.1)',
};

const titleStyle = {
  fontSize: '24px',
  textAlign: 'center',
  marginBottom: '10px',
  color: '#546fff',
  fontWeight: '600',
};

const buttonStyle = {
  backgroundColor: '#546fff',
  color: 'white',
  padding: '10px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '0.9rem',
  margin: '20px auto',     // 👉 수직 여백 + 수평 중앙정렬
  display: 'block',         // 👉 중앙 정렬 위해 반드시 필요!
};
const eventBoxStyle = {
  backgroundColor: '#546fff',
  color: 'white',
  padding: '3px 6px',
  borderRadius: '6px',
  fontSize: '0.75rem',
  marginTop: '4px',
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  lineHeight: '1.3',
  fontWeight: '500',
};
const subtitleStyle = {
  textAlign: 'center',
  marginBottom: '20px',
  fontSize: '16px',
  color: '#333',
};