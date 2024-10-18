import nextConnect from 'next-connect';
import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// **レシピの型定義**
// interface Recipe {
//   id?: number;
//   title: string;
//   description: string;
//   ingredients: string[];
//   instructions: string[];
//   image: string | null;
// }

// **Next.js APIリクエストに`file`を追加**
interface MulterRequest extends NextApiRequest {
  file?: Express.Multer.File;
}

// **データベース接続の管理**
let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const openDB = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: './recipes.db',
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
};

// **アップロードディレクトリの設定**
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// **multerの設定**
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false, // multerを使用するためにbodyParserを無効化
  },
};

// **next-connectでAPIルートの作成**
const apiRoute = nextConnect<MulterRequest, NextApiResponse>();

// **multerミドルウェアの適用**
apiRoute.use(upload.single('image'));

// **GETメソッド：レシピ取得**
apiRoute.get(async (req, res) => {
  const { id } = req.query;
  const db = await openDB();
  try {
    const recipeId = parseInt(id as string, 10);
    const recipe = await db.get('SELECT * FROM recipes WHERE id = ?', recipeId);

    if (recipe) {
      recipe.ingredients = JSON.parse(recipe.ingredients || '[]');
      recipe.instructions = JSON.parse(recipe.instructions || '[]');
      res.status(200).json(recipe);
    } else {
      res.status(404).json({ message: 'レシピが見つかりませんでした' });
    }
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ message: 'データ取得中にエラーが発生しました' });
  }
});

// **PUTメソッド：レシピ更新**
apiRoute.put(async (req, res) => {
  const { id } = req.query;
  const db = await openDB();
  try {
    const { title, description, ingredients, instructions } = req.body;
    const updatedIngredients = JSON.stringify(ingredients);
    const updatedInstructions = JSON.stringify(instructions);
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (imagePath) {
      await db.run(
        'UPDATE recipes SET title = ?, description = ?, ingredients = ?, instructions = ?, image = ? WHERE id = ?',
        title, description, updatedIngredients, updatedInstructions, imagePath, id
      );
    } else {
      await db.run(
        'UPDATE recipes SET title = ?, description = ?, ingredients = ?, instructions = ? WHERE id = ?',
        title, description, updatedIngredients, updatedInstructions, id
      );
    }

    res.status(200).json({ message: 'レシピが更新されました' });
  } catch (error) {
    console.error('Error updating recipe:', error);
    res.status(500).json({ message: 'レシピ更新中にエラーが発生しました' });
  }
});

// **DELETEメソッド：レシピ削除**
apiRoute.delete(async (req, res) => {
  const { id } = req.query;
  const db = await openDB();
  try {
    const recipeId = parseInt(id as string, 10);
    const result = await db.run('DELETE FROM recipes WHERE id = ?', recipeId);

    // `result.changes`が`undefined`の可能性に対応
    if (result?.changes && result.changes > 0) {
      res.status(200).json({ message: 'レシピが削除されました' });
    } else {
      res.status(404).json({ message: '削除対象のレシピが見つかりませんでした' });
    }
  } catch (error) {
    console.error('Error deleting recipe:', error);
    res.status(500).json({ message: 'レシピ削除中に内部エラーが発生しました' });
  }
});

// **APIルートのエクスポート**
export default apiRoute;


