import { admin } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { idToken } = req.body;
    // 12시간짜리 세션 쿠키
    const expiresIn = 12 * 60 * 60 * 1000;
    const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });
    res.setHeader("Set-Cookie", `session=${sessionCookie}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${expiresIn/1000}`);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(401).json({ error: "세션 발급 실패" });
  }
}
