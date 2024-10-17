import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const openDB = async () => {
    return open({
        filename: './recipes.db',
        driver: sqlite3.Database,
    });
};

// 画像の保存先ディレクトリ
const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// multerの設定
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // 画像保存先
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // 重複しないファイル名
    },
});

const upload = multer({ storage });

// Next.jsでmulterを使うための設定
export const config = {
    api: {
        bodyParser: false, // multerを使うためbodyParserを無効化
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;
    const db = await openDB();

    if (req.method === 'GET') {
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
    } else if (req.method === 'PUT') {
        // 画像付きのPUT処理
        upload.single('image')(req, res, async (err: unknown) => {
            if (err) {
                console.error('Error uploading image:', err);
                return res.status(500).json({ message: '画像アップロード中にエラーが発生しました' });
            }

            try {
                const { title, description, ingredients, instructions } = req.body;

                // ingredientsとinstructionsの文字列化
                const updatedIngredients = JSON.stringify(ingredients);
                const updatedInstructions = JSON.stringify(instructions);

                // アップロードされた画像パスの取得
                const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

                // 画像が新しくアップロードされた場合、画像パスも更新
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

                res.status(200).json({ message: 'Recipe updated successfully' });
            } catch (error) {
                console.error('Error updating recipe:', error);
                res.status(500).json({ message: 'レシピ更新中にエラーが発生しました' });
            }
        });
    } else if (req.method === 'DELETE') {
        try {
            const recipeId = parseInt(id as string, 10);
            const result = await db.run('DELETE FROM recipes WHERE id = ?', recipeId);

            if (result.changes > 0) {
                res.status(200).json({ message: 'レシピが削除されました' });
            } else {
                res.status(404).json({ message: '削除対象のレシピが見つかりませんでした' });
            }
        } catch (error) {
            console.error('Error deleting recipe:', error);
            res.status(500).json({ message: 'レシピ削除中に内部エラーが発生しました' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
