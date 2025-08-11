// pages/login.js
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebaseClient"; // ✅ 여기서만 auth 가져오기

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pw);
      const idToken = await cred.user.getIdToken(true);
      const res = await fetch("/api/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("세션 발급 실패");
      window.location.href = "/admin";
    } catch (e) {
      setErr(e.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>관리자 로그인</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" />
        <input type="password" placeholder="비밀번호" value={pw} onChange={e=>setPw(e.target.value)} autoComplete="current-password" />
        <button disabled={loading}>{loading ? "로그인 중..." : "로그인"}</button>
      </form>
      {err && <p style={{ color: "red" }}>{err}</p>}
    </div>
  );
}
