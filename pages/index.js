// pages/index.js
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function HomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/main");
  }, [router]);

  return null; // 혹은 로딩 화면 넣을 수도 있음
}
