import Head from "next/head";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <>
      <Head>
        <title>신청 완료</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="wrapper">
        <div className="success-box">
          <h2>✅ 대여가 완료되었습니다!</h2>
          <p className="desc">
            자세한 시간을 정하기 위해, 입력하신 내용을 바탕으로<br />
            <strong>부위원장이 개별 연락</strong>을 드릴 예정입니다.
          </p>
          <Link href="/main" className="main-btn">
            메인 페이지로 이동
          </Link>
        </div>
      </div>

      <style jsx>{`
        .wrapper {
          height: 100vh;
          background-color: #f4f0ff;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .success-box {
          background: #ffffff;
          padding: 40px 30px;
          border-radius: 14px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
          max-width: 420px;
          width: 100%;
          text-align: center;
          font-family: 'Segoe UI', sans-serif;
        }

        h2 {
          color: #4a54e1;
          margin-bottom: 18px;
          font-size: 22px;
        }

        .desc {
          font-size: 15px;
          color: #444;
          line-height: 1.7;
          margin-bottom: 25px;
        }

        strong {
          color: #333;
        }

        .main-btn {
          display: inline-block;
          background-color: #4a54e1;
          color: white;
          font-weight: bold;
          padding: 12px 24px;
          font-size: 15px;
          border-radius: 8px;
          text-decoration: none;
          transition: background-color 0.2s ease;
        }

        .main-btn:hover {
          background-color: #3e46c8;
        }
      `}</style>
    </>
  );
}
