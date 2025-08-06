import Head from "next/head";
import Link from "next/link";

export default function OrganizationPage() {
  return (
    <>
      <Head>
        <title>조직도</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="org-container">
        <h2 className="org-title">학생복지위원회 조직도</h2>
        <div className="org-image-wrapper">
          <img src="/조직도.png" alt="조직도 이미지" className="org-img" />
        </div>

        <Link href="/intro" className="back-btn">
          뒤로 돌아가기
        </Link>
      </div>

      <style jsx>{`
        .org-container {
          max-width: 1000px;
          margin: auto;
          padding: 30px;
          text-align: center;
          background: #f8f8ff;
          border-radius: 12px;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
        }

        .org-title {
          color: #4a54e1;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .org-image-wrapper {
          display: flex;
          justify-content: center;
        }

        .org-img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          box-shadow: 0 0 10px #bbb;
        }

        .back-btn {
          margin-top: 20px;
          display: inline-block;
          background: #ff6b6b;
          color: white;
          padding: 10px 20px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
        }
      `}</style>
    </>
  );
}
