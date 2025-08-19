// /pages/api/admin/availability.js
import admin from "firebase-admin";

/* ==== Firebase Admin 안전 초기화 ==== */
function initAdmin() {
  if (admin.apps.length) return;
  let raw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON || process.env.FIREBASE_ADMIN_JSON;
  if (!raw) throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON or FIREBASE_ADMIN_JSON is not set");
  try {
    const maybe = Buffer.from(raw, "base64").toString("utf8");
    JSON.parse(maybe);
    raw = maybe;
  } catch (_) {}
  admin.initializeApp({ credential: admin.credential.cert(JSON.parse(raw)) });
}
initAdmin();
const db = admin.firestore();

/* ==== 품목 최대 수량 (프론트와 반드시 동일) ==== */
const ITEM_LIMITS = {
  "천막": 10,
  "천막 가림막": 3,
  "테이블": 33,
  "의자": 30,
  "행사용 앰프": 2,
  "이동용 앰프": 2,
  "리드선 50m": 2,
  "리드선 30m": 3,
  "운반기 대형": 2,
  "운반기 소형": 1,
  "운반기 L카트": 1,
  "아이스박스 70L": 1,
  "아이스박스 50L": 2,
  "무전기": 6,
  "확성기": 6,
  "명찰": 80,
  "이젤": 5,
  "돗자리": 9,
  "1인용 돗자리": 96,
  "목장갑": 69,
  "줄다리기 줄 15m": 1,
  "줄다리기 줄 25m": 1,
  "중형 화이트보드": 1,
};

/* ==== 유틸 ==== */
function parseDateOnlyUTC(s) { const [y,m,d] = s.split("-").map(Number); return new Date(Date.UTC(y, m-1, d)); }
function addDaysUTC(d, n) { const nd = new Date(d.getTime()); nd.setUTCDate(nd.getUTCDate()+n); return nd; }
function toYMD(d) { return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,"0")}-${String(d.getUTCDate()).padStart(2,"0")}`; }
function monthBoundsUTC(yyyyMM) {
  const [y,m] = yyyyMM.split("-").map(Number);
  return { start: new Date(Date.UTC(y, m-1, 1)), end: new Date(Date.UTC(y, m, 1)) };
}
function extractDateOnly(str) { const m = String(str||"").match(/^(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null; }

export default async function handler(req, res) {
  try {
    // 표시 모드: 남은수만(left) 또는 남은/총(leftTotal)
    const mode = (req.query.mode === "leftTotal") ? "leftTotal" : "left";

    // 범위 파라미터
    let startUTC, endUTC;
    if (req.query.month) {
      ({ start: startUTC, end: endUTC } = monthBoundsUTC(req.query.month));
    } else if (req.query.start && req.query.end) {
      startUTC = parseDateOnlyUTC(req.query.start);
      endUTC = parseDateOnlyUTC(req.query.end);
    } else {
      const now = new Date();
      const cur = `${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,"0")}`;
      ({ start: startUTC, end: endUTC } = monthBoundsUTC(cur));
    }

    // 승인된 신청서 읽기
    const snap = await db.collection("rental_requests").where("status","==","approved").get();

    // 날짜별 사용량 집계
    const usageByDate = {}; // { 'YYYY-MM-DD': { '천막': used, ... } }
    snap.forEach(doc => {
      const data = doc.data();
      const s = extractDateOnly(data.rentalDate);
      const e = extractDateOnly(data.returnDate);
      const items = Array.isArray(data.items) ? data.items : [];
      if (!s || !e || items.length === 0) return;

      let cur = parseDateOnlyUTC(s);
      const end = parseDateOnlyUTC(e); // end 제외
      while (cur < end) {
        if (cur >= startUTC && cur < endUTC) {
          const key = toYMD(cur);
          if (!usageByDate[key]) usageByDate[key] = {};
          for (const it of items) {
            const name = it.name || it.itemName || it.title;
            const qty = Number(it.qty ?? it.quantity ?? 0);
            if (!name || !qty) continue;
            usageByDate[key][name] = (usageByDate[key][name] || 0) + qty;
          }
        }
        cur = addDaysUTC(cur, 1);
      }
    });

    // 이벤트: 대여 있는 날만 생성 + 모든 사용 품목 표시
    const events = [];
    for (let d = new Date(startUTC); d < endUTC; d = addDaysUTC(d, 1)) {
      const key = toYMD(d);
      const used = usageByDate[key];
      if (!used) continue; // ✅ 대여 없는 날은 생성 안 함

      // 사용된 품목만 남은 수량 계산
      const rows = Object.entries(used)
        .map(([name, u]) => {
          const limit = ITEM_LIMITS[name] ?? 0;
          if (!limit) return null;
          const left = Math.max(0, limit - u);
          return mode === "leftTotal" ? `${name} ${left}/${limit}` : `${name} ${left}`;
        })
        .filter(Boolean);

      if (rows.length === 0) continue;

      // 줄 구분: 월간 뷰에서는 줄바꿈이 잘리지 않도록 ', ' 연결 권장.
      // 필요시 '\n'로 바꿔도 됨(테마에 따라 보임/안보임 다름)
      const title = rows.join(", ");

      events.push({
        start: key,
        allDay: true,
        title,
      });
    }

    res.status(200).json({ success: true, events });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success:false, error: e.message });
  }
}
