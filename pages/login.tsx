import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post('/api/login', { email, password });
            localStorage.setItem('token', response.data.token); // JWTトークンを保存
            router.push('/'); // ログイン成功後、トップページにリダイレクト
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    return (
        <div className="container mx-auto p-8 max-w-md">
            <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
                <div>
                    <label className="block font-medium mb-1">メールアドレス:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        autoComplete="off"
                        required
                    />
                </div>
                <div>
                    <label className="block font-medium mb-1">パスワード:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full border rounded px-3 py-2 focus:outline-none focus:border-blue-500"
                        autoComplete="new-password" // オートフィルを無効にする
                        required
                    />
                </div>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded w-full">
                    ログイン
                </button>
            </form>
        </div>
    );
};

export default Login;
