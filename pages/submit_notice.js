import Head from "next/head";
import Link from "next/link";

export default function SubmitNoticePage() {
  return (
    <>
      <Head>
        <title>물품 대여 유의사항</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="wrapper">
        <div className="notice-box">
          <h2>📌 물품 대여 시 유의사항</h2>
          <ol>
            <li>
              대여 물품 고장, 손상, 분실, 타인에게 양도할 시 모든 책임은 <strong>대여자 부담</strong>입니다.
            </li>
            <li>
              물품 파손 및 분실 시, 본인 부담 비용이 발생할 수 있습니다. 
            </li>
            <li>
              공평한 물품 대여를 위하여 <strong>한 팀당 대여할 수 있는 최대 수량</strong>이 정해져 있으니, 물품 리스트를 반드시 참고하시기 바랍니다.
            </li>

            <li>
              해당 날짜에 여러 팀이 신청하여 대여 신청 수량이 준비된 수량보다 많을 경우, <strong>선착순</strong>으로 대여됩니다.
            </li>
            <li>
              대여/반납 시간을 지키지 못할 경우 다음 대여/반납 시, 불이익이 발생할 수 있습니다.  
            </li>
          </ol>
          <Link href="/success" className="next-btn">동의합니다</Link>
        </div>
      </div>

      <style jsx>{`
        .wrapper {
          min-height: 100vh;
          background-color: #e2f7b0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 40px 20px;
        }
        .notice-box {
          max-width: 600px;
          background: #fff;
          padding: 30px 28px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          font-family: 'Segoe UI', sans-serif;
        }
        h2 {
          text-align: center;
          color: #556C1E;
          margin-bottom: 24px;
          font-size: 22px;
        }
        ol {
          list-style: decimal;
          padding-left: 20px;
          font-size: 15px;
          color: #333;
          line-height: 1.8;
        }
        li + li {
          margin-top: 12px;
        }
        strong {
          font-weight: bold;
        }
        .next-btn {
          display: block;
          margin-top: 30px;
          background: #4a54e1;
          color: white;
          padding: 12px;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          text-decoration: none;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .next-btn:hover {
          background: #3e46c8;
        }
      `}</style>
    </>
  );
}
