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
          학생복지위원회는 한림대학교 학생회칙 제10장 제65조에 따라 설립된 총학생회 산하의 자치기구로,
          학우 여러분의 권익과 복지 증진을 최우선으로 실현하고자 노력하고<br />있습니다. 제19대 학생복지위원회는
          한림대학교 학우<br />여러분이 누릴 수 있는 복지 혜택을 최대한 확장하고자 다각적으로 운영되고 있습니다.
          교내 단체 및 기구들이 행사나<br />활동을 원활히 진행할 수 있도록 지원하는 것은 물론, 모든<br />학우 여러분이
          일상 속에서도 체감할 수 있는 복지 혜택을 제공하고자 끊임없이 고민하여 개선해 나가고 있습니다.
        </p>

        <div className="intro-oval">위원장단 인사말</div>
        <p className="intro-text">
          안녕하세요. 한림대학교 학우 여러분.<br />
          제19대 학생복지위원회 위원장 경영학과 20학번 유재범, 부위원장 빅데이터전공 22학번 이정민 입니다.<br />
          저희는 한림대학교 모든 학우들이 공평하게 혜택을<br />누릴 수 있도록 최선을 다하며, 다양한 방안을 모색하며<br />체감할 수 있는 변화들을 만들어 가겠습니다.<br />
          <br />
          앞으로도 학우 여러분의 다양한 의견을 경청하며,<br />보다 나은 복지 환경을 만들어 가기 위해
          노력하겠습니다.<br />
          많은 관심과 참여 부탁드립니다.
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
          <img src="/swc로고.png" alt="학생복지위원회 인스타그램 미리보기" className="insta-thumb" />
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
