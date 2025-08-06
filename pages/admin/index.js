import Head from "next/head";
import { useRouter } from "next/router";

export default function AdminMainPage() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>관리자 페이지</title>
      </Head>

      <div className="admin-container">
        <h1>📋 관리자 페이지</h1>
        <nav>
          <button onClick={() => router.push("/admin/notices")}>📢 공지사항 관리</button>
          <button onClick={() => router.push("/admin/rental_requests")}>📦 대여 신청 관리</button>
        </nav>
      </div>

      <style jsx>{`
        .admin-container {
          font-family: 'Segoe UI', sans-serif;
          text-align: center;
          background-color: #f5f5ff;
          padding: 60px;
          min-height: 100vh;
        }

        h1 {
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
      `}</style>
    </>
  );
}
