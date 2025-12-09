export default function Footer() {
  return (
    <footer className="site-footer">
      <p>© 제 19대 한림대학교 학생복지위원회 | Developed by 이정민, 문지혜, 최은영, 김민지</p>
      <p>본 사이트의 디자인 및 콘텐츠는 무단 복제 및 배포를 금합니다.</p>

      <style jsx>{`
        .site-footer {
          text-align: center;
          font-size: 10px;
          color: #888;
          padding: 1px 5px;
          border-top: 1px solid #ddd;
          background-color: #D6E8AB;
          margin-top: 40px;
        }
      `}</style>
    </footer>
  );
}