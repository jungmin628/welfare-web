import admin from "firebase-admin";

function initAdmin() {
  if (admin.apps.length) return;
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (!raw) throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON is not set");

  let creds = raw;
  try {
    const decoded = Buffer.from(raw, "base64").toString("utf8");
    JSON.parse(decoded);
    creds = decoded;
  } catch (_) {}

  const serviceAccount = JSON.parse(creds);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
initAdmin();

export { admin };
