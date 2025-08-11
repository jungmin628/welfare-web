// /pages/api/check-availability.js
import admin from "firebase-admin";

/** --- Firebase Admin 안전 초기화 --- */
function initAdmin() {
  if (admin.apps.length) return;

  let credsRaw = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  if (!credsRaw) throw new Error("FIREBASE_ADMIN_CREDENTIALS_JSON is not set");

  // base64 또는 JSON 문자열 모두 허용
  try {
    const maybeDecoded = Buffer.from(credsRaw, "base64").toString("utf8");
    JSON.parse(maybeDecoded);
    credsRaw = maybeDecoded;
  } catch (_) {
    // 이미 JSON 문자열이면 통과
  }

  const serviceAccount = JSON.parse(credsRaw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
initAdmin();

const db = admin.firestore();

/** --- 품목별 최대 수량 (프론트와 반드시 일치!) --- */
const ITEM_LIMITS = {
  "천막": 10,
  "천막 가림막": 3,
  "테이블": 16,
  "의자": 30,
  "행사용 앰프": 1,
  "이동용 앰프": 1,
  "리드선 50m": 2,
  "리드선 30m": 2,
  "운반기 대형": 1,
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

/** 문자열 → { date:'YYYY-MM-DD', hStart:number, hEnd:number } */
function parseDateHourRange(input) {
  if (!input) return null;

  // 1) "YYYY-MM-DD HH-HH"
  const m1 = String(input).match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2})-(\d{1,2})$/);
  if (m1) {
    const date = m1[1];
    const hStart = Number(m1[2]);
    const hEnd = Number(m1[3]);
    if (
      Number.isFinite(hStart) &&
      Number.isFinite(hEnd) &&
      hStart >= 0 &&
      hEnd <= 24 &&
      hStart < hEnd
    ) {
      return { date, hStart, hEnd };
    }
  }

  // 2) ISO "YYYY-MM-DDTHH:mm" → 1시간 슬롯으로 해석
  const m2 = String(input).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  if (m2) {
    const date = m2[1];
    const hStart = Number(m2[2]);
    const hEnd = Math.min(24, hStart + 1);
    return { date, hStart, hEnd };
  }

  // 3) 날짜만 들어오면 하루 종일
  const m3 = String(input).match(/^(\d{4}-\d{2}-\d{2})$/);
  if (m3) return { date: m3[1], hStart: 0, hEnd: 24 };

  return null;
}

/** 날짜 범위 확장 (YYYY-MM-DD ~ YYYY-MM-DD) */
function expandDatesInclusive(startYMD, endYMD) {
  const [y1, m1, d1] = startYMD.split("-").map(Number);
  const [y2, m2, d2] = endYMD.split("-").map(Number);
  const start = new Date(y1, m1 - 1, d1);
  const end = new Date(y2, m2 - 1, d2);

  const out = [];
  for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    out.push(`${yyyy}-${mm}-${dd}`);
  }
  return out;
}

/** 요청 전체를 시간 슬롯으로 분해: { "<day>": Set<hour> } */
function toHourlySlots(rentalDateStr, returnDateStr) {
  const s = parseDateHourRange(rentalDateStr);
  const e = parseDateHourRange(returnDateStr);
  if (!s || !e) return null;

  const days = expandDatesInclusive(s.date, e.date);
  const slots = {};
  for (const day of days) slots[day] = new Set();

  for (const day of days) {
    if (day === s.date && day === e.date) {
      // 같은 날: [hStart, hEnd)
      for (let h = s.hStart; h < e.hEnd; h++) slots[day].add(h);
    } else if (day === s.date) {
      // 시작일: [hStart, 24)
      for (let h = s.hStart; h < 24; h++) slots[day].add(h);
    } else if (day === e.date) {
      // 종료일: [0, hEnd)
      for (let h = 0; h < e.hEnd; h++) slots[day].add(h);
    } else {
      // 사이 날짜: [0,24)
      for (let h = 0; h < 24; h++) slots[day].add(h);
    }
  }
  return slots;
}

/** 승인 상태 정규화 */
function isApprovedStatus(val) {
  return (
    val === "approved" ||
    val === "승인" ||
    val === "approved_by_admin" ||
    val === true
  );
}

/** items 정규화: 배열/맵 모두 → [{ name, qty }] */
function normalizeItems(items) {
  // 배열 [{ name, qty }] / [{ itemName, quantity }]
  if (Array.isArray(items)) {
    return items
      .map((it) => ({
        name: it?.name || it?.itemName,
        qty: Number(it?.qty ?? it?.quantity ?? 0),
      }))
      .filter((it) => it.name && it.qty > 0);
  }
  // 맵 { "천막 가림막": 3, "테이블": 1 }
  if (items && typeof items === "object") {
    return Object.entries(items)
      .map(([name, qty]) => ({ name, qty: Number(qty) || 0 }))
      .filter((it) => it.name && it.qty > 0);
  }
  return [];
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Only POST allowed" });
  }

  try {
    const { rentalDate, returnDate, items } = req.body || {};
    if (!rentalDate || !returnDate || !Array.isArray(items)) {
      return res.status(400).json({ ok: false, error: "Missing fields" });
    }

    // 요청 시간 슬롯 계산
    const reqSlots = toHourlySlots(rentalDate, returnDate);
    if (!reqSlots) {
      return res.status(400).json({ ok: false, error: "Invalid date/time format" });
    }

    // 시간 슬롯 단위 사용량: used[day][hour][item] = qty
    const used = Object.create(null);

    // 승인건 로드: 상태 다양성 때문에 전체 읽고 필터
    const snap = await db.collection("rental_requests").get();
    let approvedDocsCount = 0;

    snap.forEach((doc) => {
      const data = doc.data();
      if (!isApprovedStatus(data?.status)) return;

      const aSlots = toHourlySlots(data?.rentalDate, data?.returnDate);
      if (!aSlots) return;

      const aItems = normalizeItems(data?.items);
      if (!aItems.length) return;

      approvedDocsCount++;

      for (const [day, hoursSet] of Object.entries(aSlots)) {
        if (!used[day]) used[day] = Object.create(null);
        for (const hour of hoursSet) {
          if (!used[day][hour]) used[day][hour] = Object.create(null);
          for (const it of aItems) {
            const { name, qty } = it;
            used[day][hour][name] = (used[day][hour][name] || 0) + qty;
          }
        }
      }
    });

    // 요청 품목에 대해 시간 슬롯별 잔여 수량 체크
    const conflicts = [];
    // const remainingDebug = {}; // 필요시 디버그용

    for (const [day, hoursSet] of Object.entries(reqSlots)) {
      for (const hour of hoursSet) {
        const usedOnSlot = used[day]?.[hour] || {};
        // remainingDebug[day] ??= {}; remainingDebug[day][hour] ??= {};

        for (const reqItem of items) {
          const name = reqItem?.name || reqItem?.itemName;
          const reqQty = Number(reqItem?.qty ?? reqItem?.quantity ?? 0);
          if (!name || reqQty <= 0) continue;

          const limit = ITEM_LIMITS[name];
          if (typeof limit !== "number") {
            conflicts.push({
              item: name,
              date: day,
              hour,
              reason: "unknown-item",
              required: reqQty,
              remaining: 0,
            });
            continue;
          }

          const already = usedOnSlot[name] || 0;
          const remaining = Math.max(0, limit - already);
          // remainingDebug[day][hour][name] = remaining;

          if (reqQty > remaining) {
            conflicts.push({
              item: name,
              date: day,
              hour,
              required: reqQty,
              remaining,
              limit,
              alreadyReserved: already,
            });
          }
        }
      }
    }

    if (conflicts.length) {
      return res.status(200).json({
        ok: true,
        available: false,
        policy: "per-item-hourly",
        approvedDocsCount,
        conflicts,
        // remainingDebug,
      });
    }

    return res.status(200).json({
      ok: true,
      available: true,
      policy: "per-item-hourly",
      approvedDocsCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
