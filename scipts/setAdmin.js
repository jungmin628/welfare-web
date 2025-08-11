// scripts/setAdmin.js (로컬에서 한번 실행)
import { admin } from "../lib/firebaseAdmin.js";
const EMAIL = "admin@example.com";

const user = await admin.auth().getUserByEmail(EMAIL);
await admin.auth().setCustomUserClaims(user.uid, { admin: true });
console.log("admin set!");
process.exit(0);
