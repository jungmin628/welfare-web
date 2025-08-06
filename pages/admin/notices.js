import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({ title: "", content: "" });

  const ref = collection(db, "notices");

  const fetchNotices = async () => {
    const snapshot = await getDocs(ref);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setNotices(list);
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return alert("모든 항목을 입력해주세요.");

    await addDoc(ref, {
      title: form.title,
      content: form.content,
      createdAt: serverTimestamp(),
    });

    setForm({ title: "", content: "" });
    fetchNotices();
  };

  const handleDelete = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "notices", id));
    fetchNotices();
  };

  return (
    <>
      <Head>
        <title>공지사항 관리</title>
      </Head>

      <div className="admin-notice">
        <h1>📢 공지사항 관리</h1>
        <button onClick={() => router.push("/admin")}>← 관리자 페이지로</button>

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">제목</label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />

          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            rows="4"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          ></textarea>

          <button type="submit">공지사항 추가</button>
        </form>

        <div id="noticeList">
          {notices.length === 0 ? (
            <p>등록된 공지사항이 없습니다.</p>
          ) : (
            notices.map((notice) => (
              <div className="noticeItem" key={notice.id}>
                <h3>{notice.title}</h3>
                <p>{notice.content}</p>
                <button onClick={() => handleDelete(notice.id)}>삭제</button>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-notice {
          background-color: #f8f8ff;
          padding: 30px;
          min-height: 100vh;
          font-family: "Segoe UI", sans-serif;
        }

        h1 {
          color: #4a54e1;
        }

        form {
          margin-top: 20px;
          background: #fff;
          padding: 20px;
          border-radius: 10px;
          max-width: 600px;
          margin-bottom: 30px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        }

        label {
          display: block;
          margin-bottom: 10px;
          font-weight: bold;
        }

        input,
        textarea {
          width: 100%;
          padding: 10px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 6px;
          margin-bottom: 15px;
        }

        button {
          background-color: #7b68ee;
          color: white;
          border: none;
          padding: 10px 20px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
        }

        .noticeItem {
          margin-bottom: 20px;
          background: #ffffff;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }

        .noticeItem h3 {
          margin: 0 0 5px;
          color: #4a54e1;
        }

        .noticeItem button {
          background-color: #e74c3c;
          margin-top: 10px;
        }
      `}</style>
    </>
  );
}
