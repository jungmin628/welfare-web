// pages/admin/notice_manage.js
import { useState } from "react";
import Head from "next/head";

export default function NoticeManage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const notices = JSON.parse(localStorage.getItem("notices") || "[]");
    notices.unshift({
      title: title.trim(),
      content: content.trim(),
      date: new Date().toLocaleString(),
    });
    localStorage.setItem("notices", JSON.stringify(notices));

    alert("공지사항이 등록되었습니다!");
    setTitle("");
    setContent("");
  };

  return (
    <>
      <Head>
        <title>관리자 페이지</title>
      </Head>
      <div className="admin-container">
        <h2>📢 공지사항 추가</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">제목</label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            rows="5"
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <button type="submit">공지사항 등록</button>
        </form>

        <style jsx>{`
          body {
            font-family: 'Segoe UI', sans-serif;
          }
          .admin-container {
            max-width: 600px;
            margin: auto;
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            margin-top: 3rem;
          }
          h2 {
            color: #6c63ff;
            margin-bottom: 1rem;
          }
          label {
            font-weight: bold;
            margin-top: 1rem;
            display: block;
          }
          input,
          textarea {
            width: 100%;
            padding: 0.8rem;
            margin-top: 0.3rem;
            border: 1px solid #ccc;
            border-radius: 8px;
          }
          button {
            margin-top: 1.2rem;
            padding: 0.8rem 1.5rem;
            background-color: #6c63ff;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          }
          button:hover {
            background-color: #594ae2;
          }
        `}</style>
      </div>
    </>
  );
}
