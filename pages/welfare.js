import Head from "next/head";
import Link from "next/link";
import { useState } from "react";

export default function WelfarePage() {
  const [visible, setVisible] = useState({
    detail1: false,
    detail2: false,
    detail3: false,
    detail4: false,
  });

  const toggleDetail = (id) => {
    setVisible((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <>
      <Head>
        <title>복지사업 목록</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <div className="welfare-container">
        <h2 className="welfare-title">복지사업 목록</h2>
        <p className="welfare-notice">
          ※ 모두 대여일지 작성 후 대여 및 사용 가능합니다.
        </p>

        {/* 프린트 사업 */}
        <div className="welfare-box" onClick={() => toggleDetail("detail1")}>
          프린트 사업 (1인 20매)
        </div>
        {visible.detail1 && (
          <div className="welfare-detail">
            <p>
              1. 프린트 복사 용지는 1인 20매로 제한됩니다.<br />
              단, 개인 용지 지참 시 최대 50장까지 가능합니다.
            </p>
            <p>2. 컬러와 흑백 모두 이용 가능합니다.</p>
            <p>3. 다운로드 한 파일은 삭제해주시고, 로그아웃을 꼭 해주시길 바랍니다.</p>
          </div>
        )}

        {/* 코팅기 사업 */}
        <div className="welfare-box" onClick={() => toggleDetail("detail2")}>
          코팅지 및 코팅기 사용 사업 (1팀 7매)
        </div>
        {visible.detail2 && (
          <div className="welfare-detail">
            <p>1. 방문하신 소속단체 당 최대 7매까지 가능합니다.</p>
            <p>2. 개인 방문 시, 5매까지 가능합니다.</p>
            <p>3. 개인 코팅 용지 지참 시, 제한 없이 이용 가능합니다.</p>
          </div>
        )}

        {/* 보조배터리/계산기 */}
        <div className="welfare-box" onClick={() => toggleDetail("detail3")}>
          우산, 고데기, 무선마우스, 보조배터리, <br></br>노트북 받침대,공학용 계산기 대여 사업
        </div>
        {visible.detail3 && (
          <div className="welfare-detail">
            <p>1. 파손, 분실 시 개인 부담금이 발생합니다.</p>
            <p>2. 대여날짜 기준 다음날 17시까지 반납해야 합니다.</p>
            <p>3. 미반납 시 1일당 연체료 1,000원이 부과됩니다.</p>
          </div>
        )}

        {/* 마스크/칫솔/치약 */}
        <div className="welfare-box" onClick={() => toggleDetail("detail4")}>
          일회용 마스크 및 칫솔/치약 사용 사업
        </div>
        {visible.detail4 && (
          <div className="welfare-detail">
            <p>1. 각 물품은 1일 1회 수령 가능합니다.</p>
            <p>2. 제품 재고 소진 시, 수령 불가능한 점 유의 바랍니다.</p>
          </div>
        )}

        <Link href="/intro" className="back-btn">
          뒤로 돌아가기
        </Link>
      </div>
    </>
  );
}
