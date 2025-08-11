// pages/admin/index.js
import Link from "next/link";

export default function AdminHome() {
  // 이 페이지는 실제로 렌더 안 되고 리다이렉트만 수행
  return null;
}

export async function getServerSideProps({ req }) {
  const { admin } = await import("../../lib/firebaseAdmin");
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/(?:^|;\s*)session=([^;]+)/);
  const session = match ? match[1] : null;

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  try {
    await admin.auth().verifySessionCookie(session, true);
    // ✅ 로그인만 돼 있으면 rental_requests로
    return { redirect: { destination: "/admin/rental_requests", permanent: false } };
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }
}
