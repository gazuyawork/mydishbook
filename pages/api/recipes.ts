import nextConnect from 'next-connect';
import { NextApiRequest, NextApiResponse } from 'next';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import multer from 'multer';
import fs from 'fs';

interface Recipe {
  id?: number;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  image: string | null;
}

let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

const openDB = async () => {
  if (!dbInstance) {
    dbInstance = await open({
      filename: './recipes.db',
      driver: sqlite3.Database,
    });
  }
  return dbInstance;
};

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

export const config = {
  api: { bodyParser: false },
};

const apiRoute = nextConnect<NextApiRequest & { file?: Express.Multer.File }, NextApiResponse>();

apiRoute.use(upload.single('image'));

apiRoute.get(async (req, res) => {
  try {
    const db = await openDB();
    const recipes = await db.all<Recipe[]>('SELECT * FROM recipes');
    res.status(200).json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ message: 'Error fetching recipes' });
  }
});

apiRoute.post(async (req, res) => {
  try {
    const db = await openDB();
    const { title, description, ingredients, instructions } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await db.run(
      'INSERT INTO recipes (title, description, ingredients, instructions, image) VALUES (?, ?, ?, ?, ?)',
      title, description, JSON.stringify(ingredients), JSON.stringify(instructions), imagePath
    );

    res.status(201).json({ id: result.lastID, title, description, ingredients, instructions, image: imagePath });
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.status(500).json({ message: 'Error saving recipe' });
  }
});

export default apiRoute;
