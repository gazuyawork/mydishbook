import '../styles/globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import type { AppProps } from 'next/app';
import { useAuth } from '../hooks/useAuth';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoggedIn = useAuth();

  // ログインページかどうかを判定
  const isLoginPage = router.pathname === '/login';

  return (
    <>
      <Header /> {/* すべてのページでヘッダーを表示 */}
      <main className="container mx-auto p-4 mb-10">
        {/* ログインしていない場合はログインページを表示、それ以外は通常ページ */}
        {isLoggedIn || isLoginPage ? (
          <Component {...pageProps} />
        ) : (
          <p>ログインページにリダイレクトしています...</p>
        )}
      </main>
      <Footer /> {/* すべてのページでフッターを表示 */}
    </>
  );
}

export default MyApp;
