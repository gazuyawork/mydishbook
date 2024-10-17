import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// データベース接続用の関数
const openDB = async () => {
    return open({
        filename: './recipes.db',
        driver: sqlite3.Database,
    });
};

// ログインAPIのハンドラ
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { email, password } = req.body; // リクエストからemailとpasswordを取得
        const db = await openDB(); // データベース接続
        const user = await db.get('SELECT * FROM users WHERE email = ?', email); // ユーザー情報を取得

        // デバッグ用のログ
        console.log('入力パスワード:', password);
        console.log('保存されたハッシュ:', user?.password);

        // ユーザーが存在し、かつパスワードが一致する場合
        if (user && bcrypt.compareSync(password, user.password)) {
            // JWTトークンを作成
            const token = jwt.sign({ id: user.id, role: user.role }, 'secret_key', { expiresIn: '1h' });
            res.status(200).json({ token }); // トークンをレスポンスとして返す
        } else {
            res.status(401).json({ message: 'Invalid email or password' }); // 認証失敗の場合
        }
    } else {
        // POSTメソッド以外は許可されていない
        console.log('Method Not Allowed');
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
