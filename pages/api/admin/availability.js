// /pages/api/admin/availability.js
import admin from "firebase-admin";

/** --- Firebase Admin 안전 초기화 (base64/JSON 모두 허용) --- */
function initAdmin() {
  if (admin.apps.length) return;
  let credsRaw =
    process.env.FIREBASE_ADMIN_CREDENTIALS_JSON || process.env.FIREBASE_ADMIN_JSON;
  if (!credsRaw)
    throw new Error(
      "FIREBASE_ADMIN_CREDENTIALS_JSON or FIREBASE_ADMIN_JSON is not set"
    );
  try {
    const decoded = Buffer.from(credsRaw, "base64").toString("utf8");
    JSON.parse(decoded);
    credsRaw = decoded;
  } catch (_) {}
  const serviceAccount = JSON.parse(credsRaw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
initAdmin();
const db = admin.firestore();

/** --- 품목별 최대 수량 (프론트와 반드시 일치) --- */
const ITEM_LIMITS = {
  "천막": 9,
  "천막 가림막": 3,
  "테이블": 29,
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
  "이젤": 8,
  "돗자리": 9,
  "1인용 돗자리": 96,
  "목장갑": 69,
  "줄다리기 줄 15m": 1,
  "줄다리기 줄 25m": 1,
  "중형 화이트보드": 1,
};

/** ---------- 유틸: 이름/수량/시간 정규화 ---------- */
function normalizeName(raw) {
  const n = String(raw || "").replace(/\s+/g, " ").trim();
  const alias = {
    "천막가림막": "천막 가림막",
    "아이스박스70L": "아이스박스 70L",
    "아이스박스50L": "아이스박스 50L",
    "리드선50m": "리드선 50m",
    "리드선30m": "리드선 30m",
  };
  return alias[n] || n;
}

function parseQty(val) {
  if (val == null) return 0;
  if (typeof val === "number" && Number.isFinite(val)) return Math.max(0, Math.trunc(val));
  if (typeof val === "boolean") return val ? 1 : 0;
  if (typeof val === "string") {
    const m = val.replace(/[, ]/g, "").match(/(\d+)/);
    if (m) return Math.max(0, parseInt(m[1], 10));
    if (/on|true|예|O/i.test(val)) return 1;
  }
  return 0;
}

function normalizeItems(items) {
  const pickQty = (it) =>
    it?.qty ?? it?.quantity ?? it?.count ?? it?.amount ??
    it?.selectedQty ?? it?.selectedCount ?? it?.value ?? it?.val ?? it?.n ?? it?.num ?? it?.total;

  if (Array.isArray(items)) {
    return items
      .map((it) => {
        const name = normalizeName(it?.name ?? it?.itemName ?? it?.title ?? it?.label ?? it?.key);
        const qty = parseQty(pickQty(it));
        return { name, qty };
      })
      .filter((it) => it.name && it.qty > 0);
  }
  if (items && typeof items === "object") {
    return Object.entries(items)
      .map(([k, v]) => ({ name: normalizeName(k), qty: parseQty(v) }))
      .filter((it) => it.name && it.qty > 0);
  }
  return [];
}

function isApprovedStatus(val) {
  if (val === true) return true;
  const s = String(val ?? "").trim().toLowerCase();
  // 거절/취소/대기 제외, 그 외는 승인 간주(운영 편의)
  if (/(reject|거절|취소|cancel|deny)/.test(s)) return false;
  if (/(pending|대기)/.test(s)) return false;
  return s !== "";
}

/** --- 날짜(KST 기준 키) --- */
const KST_OFFSET = 9 * 60 * 60 * 1000;
const toKST = (d) => new Date(d.getTime() + KST_OFFSET);
const fromKST = (d) => new Date(d.getTime() - KST_OFFSET);

function ymdKST(d) {
  const k = toKST(d);
  return `${k.getFullYear()}-${String(k.getMonth() + 1).padStart(2, "0")}-${String(k.getDate()).padStart(2, "0")}`;
}
function addDaysUTC(d, n) {
  const nd = new Date(d.getTime());
  nd.setUTCDate(nd.getUTCDate() + n);
  return nd;
}
function monthBoundsKST(yyyyMM) {
  const [y, m] = yyyyMM.split("-").map(Number);
  const startK = new Date(y, m - 1, 1, 0, 0, 0); // KST 자정
  const endK   = new Date(y, m, 1, 0, 0, 0);     // 다음달 KST 자정
  return { start: fromKST(startK), end: fromKST(endK) }; // 내부 UTC 처리
}
function extractDateOnly(str) {
  const m = String(str || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}
function makeKSTDate(y, m, d, h = 0, min = 0) {
  // 내부 UTC: KST(+9) 보정
  return new Date(Date.UTC(y, m - 1, d, h - 9, min, 0, 0));
}
function parseKSTRange(input) {
  if (!input) return null;
  const s = String(input).trim();

  // "YYYY-MM-DD HH-HH" / "YYYY-MM-DD HH~HH"
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2})\s*[-~]\s*(\d{1,2})$/);
  if (m) {
    const [, y, mm, d, h1, h2] = m.map(Number);
    return { start: makeKSTDate(y, mm, d, h1), end: makeKSTDate(y, mm, d, h2) };
  }

  // ISO 시작
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    const dt = new Date(s);
    if (!isNaN(dt)) return { start: dt, end: dt };
  }

  // "YYYY-MM-DD"
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const [, y, mm, d] = m.map(Number);
    return { start: makeKSTDate(y, mm, d, 0, 0), end: makeKSTDate(y, mm, d + 1, 0, 0) };
  }

  // "YYYY/MM/DD" 또는 "YYYY.MM.DD"
  m = s.match(/^(\d{4})[\/.](\d{2})[\/.](\d{2})$/);
  if (m) {
    const [, y, mm, d] = m.map(Number);
    return { start: makeKSTDate(y, mm, d), end: makeKSTDate(y, mm, d + 1) };
  }

  // "YYYY-MM-DD 16시" 같은 꼬리 제거도 허용
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, y, mm, d] = m.map(Number);
    return { start: makeKSTDate(y, mm, d), end: makeKSTDate(y, mm, d + 1) };
  }
  return null;
}

/** --- 메인 핸들러 --- */
export default async function handler(req, res) {
  try {
    // 범위: ?month=YYYY-MM  또는 ?start=YYYY-MM-DD&end=YYYY-MM-DD (end 미포함)
    let startUTC, endUTC;
    if (req.query.month) {
      ({ start: startUTC, end: endUTC } = monthBoundsKST(req.query.month));
    } else if (req.query.start && req.query.end) {
      const s = extractDateOnly(req.query.start);
      const e = extractDateOnly(req.query.end);
      if (!s || !e) return res.status(400).json({ success: false, error: "Invalid date range" });
      // 입력을 KST로 보고 내부 UTC로 변환
      const sK = new Date(s + "T00:00:00");
      const eK = new Date(e + "T00:00:00");
      startUTC = fromKST(sK);
      endUTC   = fromKST(eK);
    } else {
      const now = new Date();
      const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      ({ start: startUTC, end: endUTC } = monthBoundsKST(cur));
    }

    // 승인된 신청 읽기
    const snap = await db.collection("rental_requests").get();

    // 날짜별 사용량 {'YYYY-MM-DD': {'품목명': usedQty}}
    const usageByDate = {};

    snap.forEach((doc) => {
      const d = doc.data();
      if (!isApprovedStatus(d?.status)) return;

      const rStart = parseKSTRange(d?.rentalDateTime || d?.rentalDate || d?.startDate);
      const rEnd   = parseKSTRange(d?.returnDateTime || d?.returnDate || d?.endDate);
      if (!rStart || !rEnd) return;

      const start = rStart.start;
      const end   = rEnd.end ?? rEnd.start; // [start,end)

      // 월 범위와 교집합만 일 단위로 누적
      let cur = new Date(Math.max(start.getTime(), startUTC.getTime()));
      // 날짜를 UTC 자정으로 보정
      cur = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate()));
      const clipEnd = new Date(Math.min(end.getTime(), endUTC.getTime()));

      while (cur < clipEnd) {
        const key = ymdKST(cur);
        if (!usageByDate[key]) usageByDate[key] = {};

        const items = normalizeItems(d?.items || d?.rentalItems || d?.itemsObject);
        for (const { name, qty } of items) {
          usageByDate[key][name] = (usageByDate[key][name] || 0) + qty;
        }
        cur = addDaysUTC(cur, 1);
      }
    });

    // ✅ 이벤트 생성: "대여가 있는 날"만
    const events = [];
    // usageByDate의 키들(=대여 발생한 날)만 돌린다
    const dayKeys = Object.keys(usageByDate).sort(); // 보기 좋게 정렬
    for (const key of dayKeys) {
      const used = usageByDate[key] || {};

      // 그날 보여줄 품목 목록:
      // 1) 한도표의 모든 품목 (대여 안 했어도 표시: 남은=총량)
      // 2) 한도표에 없지만 '사용된' 품목 (한도 미설정으로 표시)
      const namesInLimits = Object.keys(ITEM_LIMITS);
      const namesExtraUsed = Object.keys(used).filter((n) => !(n in ITEM_LIMITS)).sort();
      const allNames = [...namesInLimits, ...namesExtraUsed];

      const lines = [];
      for (const name of allNames) {
        const limit = ITEM_LIMITS[name];
        const usedQty = used[name] || 0;

        if (typeof limit === "number") {
          // 대여 안 한 품목이면 usedQty=0 → 남은=총량
          const left = Math.max(0, limit - usedQty);
          lines.push(`${name} ${left}/${limit}`);
        } else {
          // 한도표에 없는데 사용된 품목은 참고용으로 노출
          if (usedQty > 0) {
            lines.push(`${name} 사용:${usedQty} (한도 미설정)`);
          }
        }
      }

      // 방어: 혹시 라인이 전혀 없으면 건너뜀
      if (lines.length === 0) continue;

      events.push({
        start: key,
        allDay: true,
        title: lines.join("\n"),
      });
    }

    return res.status(200).json({ success: true, events });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: String(e?.message || e) });
  }
}
