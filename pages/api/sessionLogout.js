export default async function handler(req, res) {
  res.setHeader("Set-Cookie", `session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
  return res.status(200).json({ ok: true });
}
