// pages/notice.js
import Head from "next/head";
import Link from "next/link";

export default function FAQPage() {
  const faqs = [
    {
      q: "물품신청서 제출을 누르면 계속해서 실패로 뜨는데 이유가 뭐인가요?",
      a: "먼저, 제출이 안되는 경우는 집회신고서 첨부파일이 700KB를 넘기 때문입니다. 첨부파일을 pdf파일을 압축해서 제출해주세요. https://www.ilovepdf.com/ko 해당 웹사이트를 들어가면, pdf 변환 및 압축이 가능합니다. 계속해서 문제가 발생할 시, 부위원장(010-9426-1027)에게 본인이 작성한 물품신청서 캡처본과 집회신고서를 보내주시기 바랍니다. " 
    },
    {
      q: "대여물품을 변경하고싶은데 어떻게 해야하나요?",
      a: "변경을 원할 시, 즉시 부위원장 이정민(010-9426-1027)로 연락부탁드리며, 원하시는 물품을 다른 단체가 이미 대여를 완료했을 시, 대여가 제한됩니다. 또한, 대여 변경을 원하여 물품신청서를 더 작성하셔도, 하나의 행사당 하나의 물품신청서를 받고 있기 때문에 같은 행사일 경우 최종으로 부위원장과 연락이 되어 승인된 물품신청서'만' 반영합니다. 대여 일정 변경 및 물품 변경의 빈도수가 많은 단체는 다음 물품 대여에 패널티가 적용될 수 있습니다. " 
    },
    {
      q: "대여 승인 후 일정 변경/취소는 어떻게 하나요?",
      a: "승인 알림을 받은 뒤에는 변경·취소가 제한될 수 있습니다. 필요한 경우 즉시 학생복지위원회로 연락해 주세요. 대여가 승인나기 전에는 마지막으로 제출하신 것으로 대여 승인 안내 드립니다. 대여 일정 변경 및 물품 변경의 빈도수가 많은 단체는 다음 물품 대여에 패널티가 적용될 수 있습니다. "
    },
    {
      q: "승인까지 얼마나 걸리나요?",
      a: "근무시간 기준 당일~익일 중으로 승인이 됩니다. 최대한 빨리 승인할 예정이니, 잠시 기다려주시기 바라며 일정에 따라 조금의 지연이 발생할 수 있습니다."
    },
    {
      q: "대여 신청은 언제 할 수 있나요?",
      a: "학생복지위원회 홈페이지를 통한 대여 신청은 상시 가능합니다. 다만, 대여 승인의 경우 학생복지위원회가 대여 가능 여부를 마지막으로 직접 확인한 후, 승인 여부를 문자로 안내드립니다."
    },
    {
      q: "대여/반납 시간은 어떻게 선택하나요?",
      a: "보통 10시부터 시작하는 행사라면 전날 저녁에 대여를 나갑니다. 반납의 경우에도 마찬가지로 17시 이후에 행사가 끝날 경우 다음날 오전에 반납합니다. 학생복지위원회 근무시간(월~목:11시부터 17시까지, 금: 11시부터 13시까지) 을 기준 설정해주시면 됩니다. "
    },
    {
      q: "이미 승인된 대여와 겹치면 어떻게 되나요?",
      a: "동일 기간에 같은 품목의 재고가 부족하면 대여가 제한됩니다."
    },
    {
      q: "최대 수량을 초과해서 대여하고 싶어요.",
      a: "일단 최대 수량으로 신청 후, 부위원장에게 별도로 문의해 주세요. 가능한 범위에서 조정해 드립니다."
    },
    
    {
      q: "반납 시 유의사항이 있나요?",
      a: "반납 시간 내에 깨끗한 상태로 반납해야 하며, 분실·파손 시 변상 규정이 적용될 수 있습니다."
    },
    {
      q: "지혜의 길이나 운동장 등 특수한 곳에서 행사를 진행하는데 집회신고서는 어떻게 작성해야하나요?",
      a: "해당 장소의 경우, 학생지원팀의 확인이 필요합니다. 결재 칸에 학생지원팀의 서명을 받으신 후 제출해주시기 바랍니다."
    },
    {
      q: "문의는 어디로 하면 되나요?",
      a: "학생복지위원장(010-5049-4135), 학생복지부위원장(010-9426-1027)에게 연락 바랍니다."
    }
  ];

  return (
    <>
      <Head>
        <title>자주하는 질문(FAQ)</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <div className="notice-container">
        <h2 className="notice-title">자주하는 질문 (FAQ)</h2>

        {/* 기존 연락 박스 유지 */}
        <div className="contact-box">
          <p>
            <strong>학생복지위원장</strong> 유재범 ☎ 010-5049-4135
          </p>
          <p>
            <strong>학생복지부위원장</strong> 이정민 ☎ 010-9426-1027
          </p>
        </div>

        {/* FAQ 아코디언 */}
        <div className="faq-wrap">
          {faqs.map(({ q, a }, i) => (
            <strong>
            <details key={i} className="faq-item">
              <summary className="faq-summary">
                <span className="faq-q">{q}</span>
                <span className="chevron" aria-hidden />
              </summary>
              <div className="faq-a">
                <p>{a}</p>
              </div>
            </details>
            </strong>
          ))}
        </div>

        <Link href="/" className="back-btn">
          메인으로
        </Link>
      </div>

      {/* 페이지 전용 스타일: 기존 style.css와 충돌 없도록 클래스 분리 */}
      <style jsx>{`
        .notice-container {
          max-width: 760px;
          margin: 40px auto;
          background: #bfd1c1ff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
        }
        .notice-title {
          text-align: center;
          margin-bottom: 16px;
          color: #556C1E;
        }
        .contact-box {
          background: #fff;
          border-radius: 10px;
          padding: 12px 16px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.06);
          margin-bottom: 18px;
          font-size: 14px;
        }

        /* FAQ 아코디언 */
        .faq-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 10px 0 20px;
        }
        .faq-item {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.06);
          border: 1px solid #eceefe;
        }

        /* summary 영역 */
        .faq-summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          cursor: pointer;
          padding: 14px 16px;
          list-style: none;
          user-select: none;
        }
        /* summary 기본 화살표 제거 (웹킷) */
        .faq-summary::-webkit-details-marker { display: none; }

        .faq-q {
          font-weight: 700;
          font-size: 15px;
          color: #222;
        }

        /* 커스텀 화살표 */
        .chevron {
          width: 10px;
          height: 10px;
          border-right: 2px solid #777;
          border-bottom: 2px solid #777;
          transform: rotate(-45deg);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        /* 답변 영역 */
        .faq-a {
          padding: 0 16px 14px 16px;
          font-size: 14px;
          color: #444;
          line-height: 1.6;
          border-top: 1px solid #f0f1ff;
        }

        /* 열렸을 때 상태 */
        .faq-item[open] .chevron {
          transform: rotate(45deg);
        }
        .faq-item[open] .faq-summary {
          background: #f8f8ff;
        }

        /* 호버 효과 */
        .faq-summary:hover {
          background: #f8f8ff;
        }

        /* 반응형 */
        @media (max-width: 480px) {
          .notice-container { margin: 24px 12px; padding: 16px; }
          .faq-q { font-size: 14px; }
          .faq-a { font-size: 13px; }
        }
      `}</style>
    </>
  );
}
