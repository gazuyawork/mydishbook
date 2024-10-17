import sqlite3 from 'sqlite3'; // sqlite3ライブラリをインポート
import { open, Database } from 'sqlite'; // open関数とDatabase型をインポート
import { NextApiRequest, NextApiResponse } from 'next';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';

// **レシピの型を定義**
interface Recipe {
  id?: number; // 新規作成時にはIDがないためオプショナル
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  image: string | null;
}

// データベース接続をグローバルに管理
let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

// データベース接続の関数
const openDB = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (!dbInstance) {
    // 型アサーションを使用して、戻り値の型を指定
    dbInstance = await open<sqlite3.Database, sqlite3.Statement>({
      filename: './recipes.db',
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
};

// 画像の保存先ディレクトリを設定
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multerの設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

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
    upload.single('image')(req, res, async (err: MulterError | Error | null) => {
      if (err) {
        return res.status(500).json({ message: '画像のアップロード中にエラーが発生しました' });
      }
      try {
        const { title, description, ingredients, instructions } = req.body;
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

        const result = await db.run(
          'INSERT INTO recipes (title, description, ingredients, instructions, image) VALUES (?, ?, ?, ?, ?)',
          title, description, JSON.stringify(ingredients), JSON.stringify(instructions), imagePath
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
    });
  } else if (req.method === 'PUT') {
    upload.single('image')(req, res, async (err: MulterError | Error | null) => {
      if (err) {
        return res.status(500).json({ message: '画像のアップロード中にエラーが発生しました' });
      }
      try {
        const { id } = req.query;
        const { title, description, ingredients, instructions } = req.body;

        await db.run(
          'UPDATE recipes SET title = ?, description = ?, ingredients = ?, instructions = ? WHERE id = ?',
          title, description, JSON.stringify(ingredients), JSON.stringify(instructions), id
        );
        return res.status(200).json({ message: 'レシピが更新されました' });
      } catch (error) {
        console.error('Error updating recipe:', error);
        return res.status(500).json({ message: 'レシピ更新中にエラーが発生しました' });
      }
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
