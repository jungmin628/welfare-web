// pages/submit.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Head from "next/head";

export default function SubmitPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    department: "",
    grade: "",
    repName: "",
    repPhone: "",
    agentName: "",
    agentPhone: "",
    place: "",
    reason: "",
    note: "",
    file: null,
    sameAsRep: false,
  });
  const [rentalDate, setRentalDate] = useState("");
  const [rentalTime, setRentalTime] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [itemsObject, setItemsObject] = useState({});

  useEffect(() => {
    const rentalFull = localStorage.getItem("rentalDateTime");
    const returnFull = localStorage.getItem("returnDateTime");
    const items = localStorage.getItem("rentalItems");
    const itemsRaw = localStorage.getItem("rentalItemsObject");

    if (!rentalFull || !returnFull || !itemsRaw) {
      alert("신청 정보가 부족합니다.");
      router.push("/rental");
      return;
    }

    const [rentalDatePart, rentalTimePart] = rentalFull.split(" ");
    const [returnDatePart, returnTimePart] = returnFull.split(" ");

    setRentalDate(rentalDatePart);
    setRentalTime(rentalTimePart);
    setReturnDate(returnDatePart);
    setReturnTime(returnTimePart);
    setItemsText(items || "");
    setItemsObject(JSON.parse(itemsRaw));
  }, [router]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "checkbox") {
      setForm((prev) => {
        const newForm = { ...prev, [name]: checked };
        if (name === "sameAsRep" && checked) {
          newForm.agentName = prev.repName;
          newForm.agentPhone = prev.repPhone;
        }
        return newForm;
      });
    } else if (files) {
      setForm((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setForm((prev) => {
        const newForm = { ...prev, [name]: value };
        if (prev.sameAsRep && (name === "repName" || name === "repPhone")) {
          newForm.agentName = name === "repName" ? value : newForm.agentName;
          newForm.agentPhone = name === "repPhone" ? value : newForm.agentPhone;
        }
        return newForm;
      });
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ["department", "grade", "repName", "repPhone", "place", "reason", "file"];
    for (const field of requiredFields) {
      if (!form[field]) {
        alert("❗ 모든 필수 항목을 입력해주세요.");
        return;
      }
    }

    if (form.file && form.file.size > 1024 * 1024 * 3) {
      alert("❗ 첨부파일은 최대 3MB까지만 업로드 가능합니다.");
      return;
    }

    try {
      const rentalFull = `${rentalDate} ${rentalTime}`;
      const returnFull = `${returnDate} ${returnTime}`;

      const data = {
        ...form,
        rentalDate: rentalFull,
        returnDate: returnFull,
        items: itemsObject,
        status: "pending",
        timestamp: serverTimestamp(),
      };

      if (form.file) {
        data.fileName = form.file.name;
        data.fileData = await fileToBase64(form.file);
        delete data.file;
      }

      await addDoc(collection(db, "rental_requests"), data);
      localStorage.clear();
      router.push("/submit_notice");

    } catch (error) {
      console.error("신청 실패:", error);
      alert("❌ 신청에 실패했습니다. 다시 시도해주세요.");
    }
  };

  return (
    <>
      <Head><title>물품 대여 신청서</title></Head>
      <div className="form-container">
        <h2 style={{ textAlign: "center", color: "#4a54e1" }}>📄 물품 대여 신청서</h2>
        <form onSubmit={handleSubmit}>
          <label>소속</label>
          <input name="department" required onChange={handleChange} />

          <label>학번</label>
          <input name="grade" required onChange={handleChange} />

          <label>대표자 이름</label>
          <input name="repName" required onChange={handleChange} />

          <label>대표자 연락처</label>
          <input name="repPhone" required onChange={handleChange} />

          <label>
            <span>대리인 정보 동일</span>
            <input type="checkbox" name="sameAsRep" checked={form.sameAsRep} onChange={handleChange} />
          </label>

          <label>대리인 이름</label>
          <input name="agentName" value={form.agentName} onChange={handleChange} readOnly={form.sameAsRep} />

          <label>대리인 연락처</label>
          <input name="agentPhone" value={form.agentPhone} onChange={handleChange} readOnly={form.sameAsRep} />

          <label>사용 장소</label>
          <input name="place" required onChange={handleChange} />

          <label>대여 물품 및 수량</label>
          <textarea value={itemsText} readOnly rows={3} />

          <label>대여일자</label>
          <input value={rentalDate} readOnly />
          <label>대여시간</label>
          <input value={rentalTime} readOnly />

          <label>반납일자</label>
          <input value={returnDate} readOnly />
          <label>반납시간</label>
          <input value={returnTime} readOnly />

          <label>대여 사유</label>
          <textarea name="reason" rows={2} onChange={handleChange} />

          <label>파일 첨부</label>
          <input type="file" name="file" onChange={handleChange} />

          <button type="submit">신청서 제출</button>
        </form>
        <button className="back-btn" onClick={() => router.back()}>이전으로</button>
      </div>

      <style jsx>{`
        .form-container {
          width: 90%;
          max-width: 600px;
          margin: 30px auto;
          background: #fff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px #ccc;
          font-size: 14px;
          line-height: 1.8;
        }
        label {
          font-weight: 600;
          display: block;
          margin-top: 15px;
          margin-bottom: 5px;
          color: #333;
        }
        input, textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
        }
        input[readonly], textarea[readonly] {
          background: #eee;
          color: #777;
          cursor: not-allowed;
        }
        button[type="submit"] {
          margin-top: 25px;
          width: 100%;
          padding: 12px;
          background: #7b68ee;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 15px;
          font-weight: bold;
          cursor: pointer;
        }
        button[type="submit"]:hover {
          background: #6656d1;
        }
        .back-btn {
          margin-top: 10px;
          display: block;
          text-align: center;
          background: #ccc;
          padding: 10px;
          border-radius: 8px;
          font-weight: bold;
          color: #333;
          width: 100%;
          font-size: 15px;
          border: none;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
