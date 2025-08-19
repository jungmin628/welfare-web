// /pages/admin/index.js
import React, { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import Link from "next/link";

// ✅ 플러그인은 그냥 import로 불러오기
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list";

const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
const dayGridPlugin = dynamic(() => import("@fullcalendar/daygrid"), { ssr: false });
const listPlugin = dynamic(() => import("@fullcalendar/list"), { ssr: false });

export default function AdminMain() {
  const [activeTab, setActiveTab] = useState("requests");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMonth = useCallback(async (yyyyMM) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/availability?month=${yyyyMM}`);
      const data = await res.json();
      if (data?.success) setEvents(data.events || []);
      else setEvents([]);
    } catch (e) {
      console.error(e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 캘린더 뷰가 바뀔 때 현재 달 기준으로 API 호출
  const handleDatesSet = async (arg) => {
    const start = arg.start; // Date
    const y = start.getFullYear();
    const m = String(start.getMonth() + 1).padStart(2, "0");
    await fetchMonth(`${y}-${m}`);
  };

  // 캘린더 탭 들어올 때 최초 1회 로드
  useEffect(() => {
    if (activeTab === "calendar") {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      fetchMonth(`${y}-${m}`);
    }
  }, [activeTab, fetchMonth]);

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

        <div className="panel">
          {activeTab === "requests" && (
            <div className="requests-pane">
              <iframe src="/admin/rental_requests" title="승인/거절" className="iframe" />
              <p className="hint">※ 필요하면 다음 단계에서 iframe 대신 직접 컴포넌트로 바꿔줄게.</p>
            </div>
          )}

          {activeTab === "calendar" && (
            <div className="calendar-pane">
              <div className="legend">
                <strong>표시</strong> : 날짜별 <em>남은/총량</em> 요약 (승인건 기준)
              </div>
              {loading && <div className="loading">불러오는 중…</div>}
              <div className="calendarBox">
                <FullCalendar
      plugins={[dayGridPlugin, listPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        start: "prev,next today",
        center: "title",
        end: "dayGridMonth,listWeek",
      }}
      events={events}
      datesSet={handleDatesSet}
    />
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .wrap { max-width: 1100px; margin: 40px auto; padding: 0 16px; }
        .header { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:16px; }
        h1 { font-size:22px; margin:0; }
        .breadcrumbs { font-size:13px; color:#666; }
        .tabs { display:flex; gap:8px; border-bottom:1px solid #e5e5e5; margin-bottom:12px; }
        .tab { padding:10px 14px; background:#fafafa; border:1px solid #e5e5e5; border-bottom:none; border-top-left-radius:8px; border-top-right-radius:8px; cursor:pointer; font-size:14px; }
        .tab.active { background:#fff; font-weight:600; box-shadow:0 -2px 6px rgba(0,0,0,0.05); }
        .panel { border:1px solid #e5e5e5; border-radius:0 8px 8px 8px; background:#fff; padding:16px; }
        .iframe { width:100%; height:78vh; border:none; border-radius:8px; background:#fff; }
        .hint { margin-top:10px; font-size:12px; color:#888; }
        .legend { display:flex; align-items:center; gap:8px; font-size:14px; margin-bottom:10px; }
        .calendarBox { border:1px solid #eee; border-radius:8px; padding:8px; background:#fff; }
        .loading { font-size:13px; color:#666; margin-bottom:8px; }
      `}</style>
    </>
  );
}
