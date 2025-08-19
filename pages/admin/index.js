// /pages/admin/index.js
import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Link from "next/link";

// ⚠️ FullCalendar는 CSR 전용으로 다이내믹 임포트
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
const dayGridPlugin = dynamic(() => import("@fullcalendar/daygrid"), { ssr: false });
const listPlugin = dynamic(() => import("@fullcalendar/list"), { ssr: false });

export default function AdminMain() {
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "calendar"
  const [events, setEvents] = useState([]);

  // 승인된 대여를 일정으로 표시 (잔여수량 계산은 다음 단계에서 API로 연결 예정)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/rental/schedule");
        const data = await res.json();
        if (data?.success) setEvents(data.events || []);
      } catch (e) {
        console.error(e);
      }
    };
    if (activeTab === "calendar") fetchEvents();
  }, [activeTab]);

  return (
    <>
      <Head>
        <title>관리자 메인</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        <header className="header">
          <h1>관리자 메인</h1>
          <nav className="breadcrumbs">
            <Link href="/">메인</Link>
            <span> / </span>
            <span>관리자</span>
          </nav>
        </header>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            승인 / 거절
          </button>
          <button
            className={`tab ${activeTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveTab("calendar")}
          >
            잔여수량 캘린더
          </button>
        </div>

        {/* Panels */}
        <div className="panel">
          {activeTab === "requests" && (
            <div className="requests-pane">
              {/* ✅ 기존 승인페이지를 그대로 재사용 (권한/스타일 그대로) */}
              <iframe
                src="/admin/rental_requests"
                title="승인/거절"
                className="iframe"
              />
              <p className="hint">
                만약 iframe 대신 같은 화면에서 리스트를 직접 렌더링하고 싶으면, 다음 단계에서
                컴포넌트를 분리해 이 탭에 넣어줄 수 있어.
              </p>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="calendar-pane">
              <div className="legend">
                <strong>표시 기준</strong> : <span>승인된 대여 일정</span>
                <small> (잔여수량 표시는 다음 단계에서 연결)</small>
              </div>

              {/* FullCalendar */}
              <div className="calendarBox">
                <FullCalendar
                  plugins={[require("@fullcalendar/daygrid").default, require("@fullcalendar/list").default]}
                  initialView="dayGridMonth"
                  headerToolbar={{
                    start: "prev,next today",
                    center: "title",
                    end: "dayGridMonth,listWeek",
                  }}
                  height="auto"
                  events={events}
                  // 필요 시 날짜/이벤트 클릭 핸들러 추가 가능
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 40px auto;
          padding: 0 16px;
        }
        .header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        h1 {
          font-size: 22px;
          margin: 0;
        }
        .breadcrumbs {
          font-size: 13px;
          color: #666;
        }
        .tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #e5e5e5;
          margin-bottom: 12px;
        }
        .tab {
          padding: 10px 14px;
          background: #fafafa;
          border: 1px solid #e5e5e5;
          border-bottom: none;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          cursor: pointer;
          font-size: 14px;
        }
        .tab.active {
          background: #fff;
          font-weight: 600;
          box-shadow: 0 -2px 6px rgba(0,0,0,0.05);
        }
        .panel {
          border: 1px solid #e5e5e5;
          border-radius: 0 8px 8px 8px;
          background: #fff;
          padding: 16px;
        }
        .iframe {
          width: 100%;
          height: 78vh;
          border: none;
          border-radius: 8px;
          background: #fff;
        }
        .hint {
          margin-top: 10px;
          font-size: 12px;
          color: #888;
        }
        .legend {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          margin-bottom: 10px;
        }
        .legend small {
          color: #888;
        }
        .calendarBox {
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 8px;
          background: #fff;
        }
      `}</style>
    </>
  );
}
