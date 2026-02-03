import Head from "next/head";
import Link from "next/link";

export default function IntroPage() {
  return (
    <>
      <Head>
        <title>학생복지위원회 소개</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <div className="intro-wrapper">
        <div className="intro-bg-logo"></div>

        <h1 className="intro-title">학생복지위원회 소개 페이지</h1>

        <div className="intro-oval">학생복지위원회 소개</div>
        <p className="intro-text">
          학생복지위원회는 한림대학교 총학생회 산하의 자치기구로써, 학우들이 보다 안정적이고 쾌적한 환경에서 학업을 이어갈 수 있도록,<br />학생 생활 
            전반에 걸친 다양한 복지사업을 진행하며 문제점을 개선해 나가고 있습니다.<br />저희는 교내 학생단체가 원활하게 활동할 수 있도록 
            지원하며,<br />학우들이 체감할 수 있는 실질적인 복지 혜택을 제공하는 데 중점을 두고 있습니다.<br />앞으로도 학생복지위원회는 
            학우 여러분의 목소리에 귀 기울이며 책임감을 가지고 역할을 수행하겠습니다.
        </p>

        <div className="intro-oval">위원장단 인사말</div>
        <p className="intro-text">
          안녕하세요. 한림대학교 학우 여러분.<br />
          제20대 학생복지위원회 위원장 사회복지학 전공 21학번 안현성,<br />부위원장 디지털미디어콘텐츠 전공 21학번 전현태입니다.<br />
          저희는 학우 여러분들의 일상 속에서 함께하며<br />일상 속 문제들을 살피고,<br />불편함을 함께 해결해나가겠습니다.<br />
          <br />
          또한 학우 여러분들의 다양한 의견에 귀 기울이며,<br />실제 변화로 이어질 수 있도록 역할을 다하고자 합니다. <br />
          앞으로의 학생복지위원회 활동에 많은 관심과 참여 부탁드립니다.<br />감사합니다.
        </p>

        <div className="intro-oval">학생복지위원회 SNS 계정 </div>
        <p className="intro-text">
          학생복지위원회의 다양한 소식은 아래의 인스타그램 계정을 통해서 확인할 수 있습니다.
        </p>

        {/* ✅ 카드형 인스타그램 링크 */}
        <a
          href="https://www.instagram.com/hallym_swc19"
          target="_blank"
          rel="noopener noreferrer"
          className="insta-card"
          aria-label="학생복지위원회 인스타그램 새 창에서 열기"
        >
          <img src="/swc로고26.png" alt="학생복지위원회 인스타그램 미리보기" className="insta-thumb" />
          <div className="insta-info">
            <span className="insta-title">학생복지위원회 인스타그램</span>
            <span className="insta-desc">@hallym_swc19 팔로우하고 최신 소식 확인하기</span>
          </div>
        </a>

        <div className="intro-btn-group">
          <Link href="/bus" className="intro-btn">
            버스 대여 신청 안내
          </Link>
          <Link href="/location" className="intro-btn">
            학생복지위원회실 위치·운영시간
          </Link>
          <Link href="/welfare" className="intro-btn">
            복지사업 목록
          </Link>
          <Link href="/organization" className="intro-btn">
            조직도
          </Link>
          
        </div>

        <Link href="/main" className="back-btn">
          메인으로 돌아가기
        </Link>
      </div>

      {/* 🔧 insta-card 전용 스타일 (style.css와 충돌 없게 클래스명 분리) */}
      <style jsx>{`
        .insta-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.1);
          padding: 12px 14px;
          margin: 16px auto 24px;
          max-width: 360px;
          text-decoration: none;
          color: #111;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .insta-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }
        .insta-thumb {
          width: 56px;
          height: 56px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
        }
        .insta-info {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .insta-title {
          font-weight: 700;
          font-size: 14px;
        }
        .insta-desc {
          margin-top: 4px;
          font-size: 12px;
          color: #777;
        }

        /* 다크/보라톤 배경에서 가독성 높이기 원하면 아래 배경색만 조정 */
        :global(.intro-wrapper) .insta-card {
          background: #fff;
        }

        /* 모바일 대응 */
        @media (max-width: 420px) {
          .insta-card { max-width: 92%; }
        }
      `}</style>
    </>
  );
}
