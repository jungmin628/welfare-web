import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

export default function NoticePage() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("notices") || "[]");
    setNotices(stored);
  }, []);

  return (
    <>
      <Head>
        <title>공지사항</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <div className="notice-container">
        <h2 className="notice-title">학생복지위원회 공지사항</h2>

        <div className="contact-box">
          <p>
            <strong>학생복지위원장</strong> 유재범 ☎ 010-5049-4135
          </p>
          <p>
            <strong>학생복지부위원장</strong> 이정민 ☎ 010-9426-1027
          </p>
        </div>

        <div id="noticeList" className="notice-list">
          {notices.length > 0 ? (
            notices.map((notice, i) => (
              <div key={i} className="notice-item">
                <h3>{notice.title}</h3>
                <p
                  dangerouslySetInnerHTML={{
                    __html: notice.content.replace(/\n/g, "<br>"),
                  }}
                />
                <hr />
              </div>
            ))
          ) : (
            <p className="notice-placeholder">
              📌 추후 공지사항이 이곳에 추가될 예정입니다.
            </p>
          )}
        </div>

        <Link href="/intro" className="back-btn">
          뒤로 돌아가기
        </Link>
      </div>
    </>
  );
}
