import Head from "next/head";
import Script from "next/script";
import { useEffect } from "react";

export default function SchedulePage() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.FullCalendar) {
      const calendarEl = document.getElementById("calendar");
      const calendar = new window.FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,listWeek",
        },
        locale: "ko",
        height: "auto",
      });

      fetch("/api/rental/schedule")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            calendar.addEventSource(data.events);
          } else {
            alert("일정 데이터를 불러오지 못했습니다.");
          }
        })
        .catch((e) => alert("서버 통신 오류: " + e.message));

      calendar.render();
    }
  }, []);

  return (
    <>
      <Head>
        <title>학생복지위원회 일정</title>
        <link
          href="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.css"
          rel="stylesheet"
        />
      </Head>

      <Script
        src="https://cdn.jsdelivr.net/npm/fullcalendar@6.1.8/index.global.min.js"
        strategy="beforeInteractive"
      />

      <h2>학생복지위원회 대여 일정</h2>
      <div id="calendar"></div>

      <style jsx>{`
        body {
          font-family: "Segoe UI";
          margin: 0;
          padding: 0;
          background: #f7f7ff;
        }
        h2 {
          text-align: center;
          margin: 20px 0;
          color: #4a54e1;
        }
        #calendar {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </>
  );
}
