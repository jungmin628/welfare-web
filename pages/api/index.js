import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";

export default async function handler(req, res) {
  const rentalRef = collection(db, "rentalRequests");

  if (req.method === "POST") {
    const data = req.body;
    await addDoc(rentalRef, data);
    res.status(200).json({ success: true });
  }

  if (req.method === "GET") {
    const snapshot = await getDocs(rentalRef);
    const submissions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json({ submissions });
  }
}
