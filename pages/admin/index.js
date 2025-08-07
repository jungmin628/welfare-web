import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";

export default function AdminMainPage() {
  const router = useRouter();
  const [accessGranted, setAccessGranted] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  const handlePasswordSubmit = () => {
    if (passwordInput === "gkrqhrdnlvkdlxld!") {
      setAccessGranted(true);
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  return (
    <>
      <Head>
        <title>관리자 페이지</title>
      </Head>

      <div className="admin-container">
        {!accessGranted ? (
          <div className="login-box">
            <h2>🔒 관리자 페이지</h2>
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button onClick={handlePasswordSubmit}>입장하기</button>
          </div>
        ) : (
          <>
            <h1>📋 관리자 페이지</h1>
            <nav>
              <button onClick={() => router.push("/admin/notices")}>📢 공지사항 관리</button>
              <button onClick={() => router.push("/admin/rental_requests")}>📦 대여 신청 관리</button>
            </nav>
          </>
        )}
      </div>

      <style jsx>{`
        .admin-container {
          font-family: 'Segoe UI', sans-serif;
          text-align: center;
          background-color: #f5f5ff;
          padding: 60px;
          min-height: 100vh;
        }

        h1, h2 {
          color: #4a54e1;
          margin-bottom: 40px;
        }

        nav {
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        button {
          padding: 15px 30px;
          font-size: 16px;
          font-weight: bold;
          background-color: #7b68ee;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
        }

        button:hover {
          background-color: #5f55d1;
        }

        .login-box input {
          padding: 10px;
          font-size: 16px;
          margin-right: 10px;
          border-radius: 5px;
          border: 1px solid #ccc;
        }
      `}</style>
    </>
  );
}
