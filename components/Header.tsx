import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import Image from 'next/image';

const Header = () => {
    const router = useRouter();
    const isLoggedIn = useAuth();
    const [isLoginPage, setIsLoginPage] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        setIsLoginPage(router.pathname === '/login');
    }, [router.pathname]);

    const handleLogout = () => {
        localStorage.removeItem('token'); // トークンを削除
        router.push('/login'); // ログインページにリダイレクト
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    return (
        <header className="bg-green-200 text-white p-4">
            <div className="container mx-auto flex justify-between items-center max-w-4xl">
                <Link href="/">
                    <Image 
                        src="/images/MyDishBook.png" 
                        alt="MyDishBook Logo" 
                        width={200} 
                        height={50} 
                    />
                </Link>
                <nav className="relative">
                    {isLoggedIn && !isLoginPage ? (
                        <div className="relative">
                            {/* ハンバーガーメニューアイコン */}
                            <button
                                className="focus:outline-none"
                                onClick={toggleMenu}
                            >
                                {/* ハンバーガーアイコンのアニメーション */}
                                <div className="relative w-5 h-5 flex flex-col justify-between items-center mb-4 mr-5">
                                    <span
                                        className={`block w-5 h-[2px] bg-gray-800 rounded transform transition-transform duration-300 ease-in-out ${
                                            menuOpen ? 'rotate-45 translate-y-[7px]' : ''
                                        }`}
                                    ></span>
                                    <span
                                        className={`block w-5 h-[2px] bg-gray-800 rounded transition-opacity duration-300 ease-in-out ${
                                            menuOpen ? 'opacity-0' : ''
                                        }`}
                                    ></span>
                                    <span
                                        className={`block w-5 h-[2px] bg-gray-800 rounded transform transition-transform duration-300 ease-in-out ${
                                            menuOpen ? '-rotate-45 -translate-y-[10px]' : ''
                                        }`}
                                    ></span>
                                </div>
                            </button>

                            {/* ハンバーガーメニューの内容 */}
                            <div
                                className={`absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-lg z-50 transform transition-transform duration-300 ease-in-out ${
                                    menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
                                }`}
                            >
                                <ul className="py-2">
                                    <li>
                                        <Link href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                                            ホーム
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                                            プロフィール
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-200">
                                            設定
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-200"
                                        >
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    ) : null}
                </nav>
            </div>
        </header>
    );
};

export default Header;
