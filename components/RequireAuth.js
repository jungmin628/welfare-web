// components/RequireAuth.js
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";
import { auth } from "../lib/firebaseClient";

export default function RequireAuth({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // 로그인 안 됨 → 로그인 페이지로
        router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
      } else {
        setChecking(false);
      }
    });
    return () => unsub();
  }, [router]);

  if (checking) return <div style={{padding:20,textAlign:"center"}}>접근 권한 확인 중...</div>;
  return children;
}
