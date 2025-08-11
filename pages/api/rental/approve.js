import { admin } from "../../../lib/firebaseAdmin";

export default async function handler(req, res) {
  const cookies = req.headers.cookie || "";
  const match = cookies.match(/(?:^|;\s*)session=([^;]+)/);
  const session = match ? match[1] : null;
  if (!session) return res.status(401).json({ error: "unauthenticated" });

  try {
    const decoded = await admin.auth().verifySessionCookie(session, true);
    if (!decoded.admin) return res.status(403).json({ error: "forbidden" });

    // ... 실제 관리자 로직 ...
    return res.json({ ok: true });
  } catch (e) {
    return res.status(401).json({ error: "invalid session" });
  }
}
