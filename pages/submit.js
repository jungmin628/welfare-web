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
      alert("❌ 신청에 실패했습니다. 다시 시도해주세요. 첨부된 파일의 용량을 다시 확인해주세요. 3MB 이하의 파일을 제출해주세요. 문제가 지속될 시, 부위원장에게 연락 바랍니다. \n\n 부위원장 이정민 : 010-9426-1027 ");
    }
  };

  return (
    <>
      <Head><title>물품 대여 신청서</title></Head>
<div className="form-container">
        <h2 style={{ textAlign: "center", color: "#4a54e1" }}>📄 물품 대여 신청서</h2>
              <h3 style={{textAlign: "center"}}><strong style={{color:"red"}}>하나의 행사당 한 개의 물품대여 신청서</strong> 를 작성할 수 있습니다. <br /> 대여물품 변경은 추후 어려울 수 있으니, <br />신중하게 물품을 정하고 작성해주시기 바랍니다.</h3>
      
        <form onSubmit={handleSubmit}>
          <label>소속</label>
          <input name="department" required placeholder="ex) 학생복지위원회" onChange={handleChange} />

          <label>학번</label>
          <input name="grade" required placeholder="20xxxxxx(8자)" onChange={handleChange} />

          <label>대표자 이름</label>
          <input name="repName" required onChange={handleChange} />

          <label>대표자 연락처</label>
          <input name="repPhone" required placeholder="010-1234-5678" onChange={handleChange} />

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

          <label>대여 사유 (대여와 반납시간 별개로, 자세하게 행사 운영날짜와 시간, 행사명을 적어주세요.)</label>
          <textarea name="reason" rows={2} placeholder="예: 9월 1일 10시~17시 개강행사" onChange={handleChange} />

          <label>집회신고서 첨부<br /> <strong> ⚠️ 서명이 완료된 pdf/hwp/docs 파일로 제출. 3MB 넘을 시 제출 제한됩니다. ⚠️</strong></label>
          
          <details className="example-toggle">
            <summary>집회신고서 예시 보기</summary>
            <div className="example-img-wrap">
              <a href="/물품대여용 집회신고서.hwp" download>물품신청서 제출용 집회신고서 파일 다운로드하기</a>
              <br />
              <img
                src="/집회신고서.png"
                alt="집회신고서 예시 이미지"
                className="example-img"
              />
              <p className="example-tip">위의 예시와 같이 작성 후, 제출해주세요.</p>
            </div>
          </details>
          <br />
          <input type="file" name="file" onChange={handleChange} />
          
          <label>기타 문의 사항</label>
          <input name="qna" onChange={handleChange} />


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
          padding: 5px 8px;
          border: 1px solid #ccc;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
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
          .example-toggle {
          margin-top: 8px;
          border: 1px solid #eee;
          border-radius: 8px;
          padding: 8px 10px;
          background: #fafafa;
        }
        .example-toggle > summary {
          cursor: pointer;
          font-weight: 600;
          list-style: none;
        }
        .example-toggle > summary::-webkit-details-marker {
          display: none;
        }
        .example-toggle > summary::after {
          content: "▼";
          float: right;
          transform: translateY(2px);
          font-size: 12px;
          opacity: 0.6;
        }
        .example-toggle[open] > summary::after {
          content: "▲";
        }
        .example-img-wrap {
          margin-top: 10px;
        }
        .example-img {
          max-width: 100%;
          height: auto;
          border: 1px solid #eee;
          border-radius: 8px;
          display: block;
        }
        .example-tip {
          margin-top: 6px;
          font-size: 12px;
          color: #666;
        }
      `}</style>
    </>
  );
}
