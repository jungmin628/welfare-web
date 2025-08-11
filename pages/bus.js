import Head from "next/head";

export default function BusRental() {
  return (
    <>
      <Head>
        <title>버스 대여 신청</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="container">
        <div className="card">
          <div>
            <h1 className="title">버스 대여 안내</h1>
            <p className="description">
              버스 대여를 원하실 경우, 집회신고서를 먼저 작성하신 후<br />
              학생복지위원회 위원장에게 연락하시고, 학생복지위원회실로 방문해
              주시길 바랍니다.<br />
              <br />
              ※ 서류 양식 및 문의는 학생복지위원회에 문의해주세요.
            </p>
          </div>
          <div className="contact-wrapper">
            <div className="contact-button">
              ☎ 학생복지위원장 유재범 : 010-5049-4135
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          background-image: url("/배경.jpg"); /* public/배경.jpg 있어야 함 */
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;

          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          margin: 0;
          font-family: "Roboto", sans-serif;
        }

        .card {
          background-color: #ffffff;
          border-radius: 24px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
          padding: 30px 40px;
          max-width: 560px;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          z-index: 1;
          color: #1a202c;
        }

        .card .title {
          font-size: 28px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .card .description {
          font-size: 16px;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 30px;
        }

        .contact-wrapper {
          display: flex;
          justify-content: flex-start;
        }

        .contact-button {
          background-color: #6b46c1;
          color: white;
          padding: 12px 24px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          cursor: default;
          user-select: none;
          box-shadow: 0 4px 12px rgba(107, 70, 193, 0.4);
          transition: background-color 0.3s ease;
        }

        .contact-button:hover {
          background-color: #553c9a;
        }
      `}</style>
    </>
  );
}
