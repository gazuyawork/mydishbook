import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// データベース接続をグローバルに管理
let dbInstance: unknown = null;

const openDB = async () => {
    if (!dbInstance) {
        dbInstance = await open({
            filename: './recipes.db',
            driver: sqlite3.Database
        });
    }
    return dbInstance;
};

// 画像の保存先ディレクトリを設定
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// multerの設定（画像の保存先とファイル名の設定）
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // 保存先ディレクトリ
    },
    filename: function (req, file, cb) {
        // タイムスタンプを使ってファイル名を生成し、重複を防ぐ
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Next.jsでmulterを使用するための設定
export const config = {
    api: {
        bodyParser: false // multerを使うため、bodyParserを無効にする
    }
};

// APIのハンドラ
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const db = await openDB();

    // レシピの取得処理 (GET)
    if (req.method === 'GET') {
        try {
            const recipes = await db.all('SELECT * FROM recipes');
            // データベースから取得したJSON文字列をオブジェクトに変換
            const formattedRecipes = recipes.map((recipe: unknown) => ({
                ...recipe,
                ingredients: JSON.parse(recipe.ingredients),
                instructions: JSON.parse(recipe.instructions)
            }));

            return res.status(200).json(formattedRecipes);
        } catch (error) {
            console.error('Error fetching recipes:', error);
            return res.status(500).json({ message: 'データ読み込み中にエラーが発生しました' });
        }
    }

    // レシピの保存処理 (POST)
    if (req.method === 'POST') {
        // 画像のアップロード処理
        upload.single('image')(req, res, async (err: unknown) => {
            if (err) {
                return res.status(500).json({ message: '画像のアップロード中にエラーが発生しました' });
            }

            try {
                const { title, description, ingredients, instructions } = req.body;

                // アップロードされた画像のパスを確認
                const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

                // データベースにレシピを保存（画像パスも保存）
                const result = await db.run(
                    'INSERT INTO recipes (title, description, ingredients, instructions, image) VALUES (?, ?, ?, ?, ?)',
                    title, description, JSON.stringify(ingredients), JSON.stringify(instructions), imagePath
                );

                const newRecipe = {
                    id: result.lastID,
                    title,
                    description,
                    ingredients: JSON.parse(ingredients),
                    instructions: JSON.parse(instructions),
                    image: imagePath
                };

                return res.status(201).json(newRecipe);
            } catch (error) {
                console.error('Error saving new recipe:', error);
                return res.status(500).json({ message: 'レシピ保存中にエラーが発生しました' });
            }
        });

    // PUT メソッドの処理
    } else if (req.method === 'PUT') {
        upload.single('image')(req, res, async (err: unknown) => {
            if (err) {
                return res.status(500).json({ message: '画像のアップロード中にエラーが発生しました' });
            }

            try {
                const { id } = req.query;
                const { title, description, ingredients, instructions } = req.body;

                // データベースを更新する処理
                await db.run(
                    'UPDATE recipes SET title = ?, description = ?, ingredients = ?, instructions = ? WHERE id = ?',
                    title, description, ingredients, instructions, id
                );

                return res.status(200).json({ message: 'レシピが更新されました' });
            } catch (error) {
                return res.status(500).json({ message: 'レシピ更新中にエラーが発生しました' });
            }
        });


    } else {
        res.setHeader('Allow', ['GET', 'POST', 'PUT']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
