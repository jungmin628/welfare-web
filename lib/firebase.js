import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD5ZT7cUj-qtO8xygAr99RkD_vekM5Dq-g",
  authDomain: "welfare-website.firebaseapp.com",
  projectId: "welfare-website",
  storageBucket: "welfare-website.appspot.com", // ← 여기도 수정
  messagingSenderId: "776745190445",
  appId: "1:776745190445:web:6cc0ad6cb428b92ace24a4",
};

// 중복 초기화 방지
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
