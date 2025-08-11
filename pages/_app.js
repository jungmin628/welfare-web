// pages/_app.js
import '../styles/style.css';
import Footer from "../components/footer";

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Footer /> {/* 모든 페이지에 Footer 추가 */}
    </>
  );
}
