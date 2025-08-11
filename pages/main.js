import Head from "next/head";
import Link from "next/link";

export default function MainPage() {
  return (
    <>
      <Head>
        <title>학생복지위원회 메인페이지</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <div className="new-main-container">
        <img src="/swc로고.png" className="main-logo" alt="학생복지위원회 로고" />

        <div className="new-menu-grid">
          <Link href="/intro" className="new-menu-item">
            학생복지위원회 소개 및 버스 대여 신청 안내
          </Link>
          <Link href="/rental" className="new-menu-item">
            물품 대여 신청
          </Link>
          <Link href="/notice" className="new-menu-item">
            자주 하는 질문
          </Link>
          <Link href="/schedule" className="new-menu-item">
            학생복지위원회 <br></br>물품대여 일정
          </Link>
        </div>
        <br /><br />
        <span >문의사항이 있을 경우, <strong>"자주 하는 질문" </strong>을 먼저 확인해주시기 바랍니다. </span>
        <br /> <br />
        <span>
          <strong> 제19대 학생복지위원회 위원장 유재범 : 010-5049-4135
          <br /> 제19대 학생복지위원회 부위원장 이정민 : 010-9426-1027
        </strong> </span>
      </div>
      <style jsx>{`
      span{
        color : #9352E6
      }
      `}</style>
    </>
  );
}
