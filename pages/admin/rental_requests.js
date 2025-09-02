// pages/admin/rental_requests.js
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection, getDocs, updateDoc, deleteDoc, doc, query, orderBy
} from "firebase/firestore";
import Head from "next/head";
import RequireAuth from "../../components/RequireAuth";

/** 인증 통과 후에만 렌더되는 실제 관리자 화면 */
function AdminRentalRequestsInner() {
  const [requests, setRequests] = useState([]);

  const fetchRequests = async () => {
    const q = query(collection(db, "rental_requests"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    setRequests(list);
  };

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "rental_requests", id), { status: "approved" });
    fetchRequests();
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "rental_requests", id));
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <>
      <Head><title>관리자 대여 신청 목록</title></Head>
      <div className="container">
        <h2>📋 대여 신청 목록 (관리자)</h2>

        {requests.length === 0 ? (
          <p>불러오는 중이거나 신청 내역이 없습니다.</p>
        ) : (
          requests.map((req, i) => (
            <div key={req.id} className="card">
              <h4>{i + 1}. {req.rentalDate} ~ {req.returnDate}</h4>
              <p><strong>상태:</strong> <span className={`status ${req.status}`}>{req.status}</span></p>

              <p><strong>소속:</strong> {req.department}</p>
              <p><strong>학번:</strong> {req.grade}</p>
              <p><strong>대표자:</strong> {req.repName} ({req.repPhone})</p>
              <p><strong>대리인:</strong> {req.agentName} ({req.agentPhone})</p>
              <p><strong>사용 장소:</strong> {req.place}</p>

              <p><strong>대여 물품:</strong></p>
              <ul>
                {req.items && Object.entries(req.items).map(([item, qty]) => (
                  <li key={item}>{item}: {qty}개</li>
                ))}
              </ul>

              <p><strong>대여 사유:</strong> {req.reason || "-"}</p>
              <p><strong>기타문의사항:</strong> {req.qna || "-"}</p>

              {req.fileName && req.fileData && (
                <p>
                  <strong>첨부파일:</strong>{" "}
                  <a href={req.fileData} download={req.fileName} target="_blank" rel="noopener noreferrer">
                    {req.fileName}
                  </a>
                </p>
              )}

              {req.status === "pending" && (
                <div className="actions">
                  <button className="approve" onClick={() => handleApprove(req.id)}>승인</button>
                  <button className="reject" onClick={() => handleDelete(req.id)}>삭제</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .container { max-width: 800px; margin: 30px auto; padding: 20px; font-family: 'Segoe UI'; }
        h2 { text-align: center; color: #4a54e1; }
        .card { background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 5px #ccc; margin-bottom: 20px; font-size: 15px; }
        .card h4 { margin: 0 0 10px; }
        .status { font-weight: bold; padding: 2px 8px; border-radius: 6px; }
        .status.pending { background: #fff3cd; color: #856404; }
        .status.approved { background: #d4edda; color: #155724; }
        .status.rejected { background: #f8d7da; color: #721c24; }
        .actions { margin-top: 15px; }
        .actions button { margin-right: 10px; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        .approve { background: #4caf50; color: white; }
        .reject { background: #f44336; color: white; }
        ul { padding-left: 20px; margin: 5px 0; }
        a { color: #4a54e1; text-decoration: underline; }
      `}</style>
    </>
  );
}

/** 기본 내보내기: 로그인 필요 가드 */
export default function AdminRentalRequests() {
  return (
    <RequireAuth>
      <AdminRentalRequestsInner />
    </RequireAuth>
  );
}