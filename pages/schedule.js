// /pages/schedule.js
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { app } from '../lib/firebase';

export default function SchedulePage() {
  const [events, setEvents] = useState([]);

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
      <div style={{
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
      }}>
        {eventInfo.event.title}
      </div>
    );
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>📅 학생복지위원회 대여 일정</h2>
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
  marginBottom: '20px',
  color: '#546fff',
  fontWeight: '600',
};