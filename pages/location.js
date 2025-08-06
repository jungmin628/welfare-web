import Head from "next/head";
import Link from "next/link";

export default function LocationPage() {
  return (
    <>
      <Head>
        <title>학생복지위원회실 위치, 운영시간</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <div className="location-container">
        <img src="/위치.png" alt="위치 이미지" className="location-img" />
        <h2 className="location-title">학생복지위원회실 위치 및 운영시간 안내</h2>

        <div className="location-info">
          <p>
            <strong>위치:</strong> CLC 4층 학생복지위원회실 9-409호실
          </p>
          <p>
            <strong>운영시간:</strong> 월-목 11시-17시, 금 11시-13시 (공휴일 제외)
          </p>
          <ul className="location-notice">
            <li>공휴일은 운영되지 않습니다.</li>
            <li>근무시간 외의 대여와 반납은 받지 않습니다.</li>
            <li>
              근무자 부재 시, 공지사항 페이지에 있는 연락처로 연락 바랍니다.
            </li>
          </ul>
        </div>

        <Link href="/intro" className="back-btn">
          뒤로 돌아가기
        </Link>
      </div>
    </>
  );
}
