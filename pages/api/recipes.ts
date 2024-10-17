import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';

// **レシピの型を定義**
interface Recipe {
  id?: number;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  image: string | null;
}

// データベース接続をグローバルに管理
let dbInstance: sqlite3.Database | null = null;

const openDB = async () => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: './recipes.db',
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
};

// Vercelの環境では「/tmp」ディレクトリのみ書き込み可能
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multerの設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // 保存先ディレクトリ
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // タイムスタンプで重複回避
  },
});
const upload = multer({ storage });

// **Next.jsのAPIルートでmulterを使うためのラップ関数**
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
};

// Next.jsでmulterを使用するための設定
export const config = {
  api: {
    bodyParser: false, // multerを使うためbodyParserを無効化
  },
};

// **APIハンドラ**
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const db = await openDB();

  if (req.method === 'GET') {
    try {
      const recipes: Recipe[] = await db.all<Recipe[]>('SELECT * FROM recipes');
      const formattedRecipes = recipes.map((recipe) => ({
        ...recipe,
        ingredients: JSON.parse(recipe.ingredients as unknown as string),
        instructions: JSON.parse(recipe.instructions as unknown as string),
      }));
      return res.status(200).json(formattedRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return res.status(500).json({ message: 'データ読み込み中にエラーが発生しました' });
    }
  }

  if (req.method === 'POST') {
    try {
      // multerのミドルウェアを実行
      await runMiddleware(req, res, upload.single('image'));

      const { title, description, ingredients, instructions } = req.body;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await db.run(
        'INSERT INTO recipes (title, description, ingredients, instructions, image) VALUES (?, ?, ?, ?, ?)',
        title,
        description,
        JSON.stringify(ingredients),
        JSON.stringify(instructions),
        imagePath
      );

      const newRecipe: Recipe = {
        id: result.lastID,
        title,
        description,
        ingredients: JSON.parse(ingredients),
        instructions: JSON.parse(instructions),
        image: imagePath,
      };

      return res.status(201).json(newRecipe);
    } catch (error) {
      console.error('Error saving new recipe:', error);
      return res.status(500).json({ message: 'レシピ保存中にエラーが発生しました' });
    }
  } else if (req.method === 'PUT') {
    try {
      await runMiddleware(req, res, upload.single('image'));

      const { id } = req.query;
      const { title, description, ingredients, instructions } = req.body;

      await db.run(
        'UPDATE recipes SET title = ?, description = ?, ingredients = ?, instructions = ? WHERE id = ?',
        title,
        description,
        JSON.stringify(ingredients),
        JSON.stringify(instructions),
        id
      );

      return res.status(200).json({ message: 'レシピが更新されました' });
    } catch (error) {
      console.error('Error updating recipe:', error);
      return res.status(500).json({ message: 'レシピ更新中にエラーが発生しました' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
