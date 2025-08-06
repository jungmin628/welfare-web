import { useEffect, useState } from "react";
import Head from "next/head";

export default function MyPage() {
  const [records, setRecords] = useState([]);
  const [repName, setRepName] = useState("");

  // 데이터 불러오기
  useEffect(() => {
    const name = localStorage.getItem("myRepName");
    setRepName(name);
    if (!name) return;

    fetchRecords(name);

    const interval = setInterval(() => fetchRecords(name), 10000); // 10초마다 자동 갱신
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "myRequests") {
        fetchRecords(repName);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [repName]);

  const fetchRecords = async (name) => {
    try {
      const res = await fetch("/api/rental");
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.submissions || [];
      setRecords(list.filter((r) => r.repName === name));
    } catch (e) {
      console.error("데이터 불러오기 실패", e);
      setRecords([]);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("정말 신청을 취소하시겠습니까?")) return;

    try {
      const res = await fetch("/api/rental/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "취소됨" }),
      });

      const data = await res.json();
      if (data.success) {
        alert("신청이 취소되었습니다.");
        fetchRecords(repName);
      } else {
        alert("취소 실패: " + (data.message || ""));
      }
    } catch (err) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <>
      <Head>
        <title>내 정보</title>
      </Head>
      <div className="info-box">
        <h2>📦 내 물품 대여 내역</h2>
        <div id="record-container">
          {!repName ? (
            <p>대표자 이름이 설정되지 않았습니다.</p>
          ) : records.length === 0 ? (
            <p>신청 내역이 없습니다.</p>
          ) : (
            records.map((req) => (
              <div className="record" key={req.id}>
                <p><strong>소속:</strong> {req.department}</p>
                <p><strong>학번:</strong> {req.grade}</p>
                <p><strong>대표자 이름:</strong> {req.repName}</p>
                <p><strong>대표자 연락처:</strong> {req.repPhone}</p>
                <p><strong>대리인 이름:</strong> {req.agentName || "-"}</p>
                <p><strong>대리인 연락처:</strong> {req.agentPhone || "-"}</p>
                <p><strong>사용 장소:</strong> {req.place}</p>
                <p><strong>대여 물품 및 수량:</strong> <span dangerouslySetInnerHTML={{ __html: req.items.replace(/\n/g, "<br>") }} /></p>
                <p><strong>대여일자:</strong> {req.rentalDate}</p>
                <p><strong>반납일자:</strong> {req.returnDate}</p>
                <p><strong>대여 사유:</strong> {req.reason || "-"}</p>
                <p><strong>비고:</strong> {req.note || "-"}</p>
                {req.fileName && req.fileData && (
                  <p>
                    <strong>첨부 파일:</strong>{" "}
                    <a href={req.fileData} download={req.fileName}>
                      {req.fileName}
                    </a>
                  </p>
                )}
                <p>
                  <strong>신청 상태:</strong>{" "}
                  <span className={`status ${req.status || "대기"}`}>{req.status || "대기"}</span>
                </p>
                <button
                  className="delete-btn"
                  onClick={() => handleCancel(req.id)}
                  disabled={req.status === "승인됨"}
                >
                  신청 취소
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        body {
          font-family: "Segoe UI";
          background: #f3f0ff;
          padding: 30px;
        }
        .info-box {
          background: #fff;
          border-radius: 10px;
          padding: 20px;
          max-width: 600px;
          margin: auto;
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
        }
        h2 {
          text-align: center;
          color: #4a54e1;
        }
        .record {
          border: 1px solid #ddd;
          padding: 15px;
          margin-top: 15px;
          border-radius: 8px;
          background: #fafaff;
        }
        .record p {
          margin: 5px 0;
        }
        .delete-btn {
          background: #f45c5c;
          color: #fff;
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: bold;
          cursor: pointer;
        }
        .delete-btn:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        .status {
          font-weight: bold;
          padding: 4px 8px;
          border-radius: 5px;
          display: inline-block;
          margin-left: 8px;
        }
        .대기 {
          background: #f0ad4e;
          color: white;
        }
        .승인됨 {
          background: #5cb85c;
          color: white;
        }
        .거절됨,
        .취소됨 {
          background: #d9534f;
          color: white;
        }
      `}</style>
    </>
  );
}
