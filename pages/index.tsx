import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

interface Recipe {
    id: number;
    title: string;
    description: string;
    image?: string | null;
}

const Home = () => {
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchRecipes = async () => {
            const response = await axios.get<Recipe[]>('/api/recipes');
            setRecipes(response.data);
        };
        fetchRecipes();
    }, []);

    const handleDelete = async (id: number) => {
        try {
            await axios.delete(`/api/recipes/${id}`);
            setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
        } catch (error) {
            console.error('Error deleting recipe:', error);
        }
    };

    const filteredRecipes = recipes.filter((recipe) =>
        recipe?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <div className="mt-10 mb-6 flex justify-between items-center">
                <input
                    type="text"
                    placeholder="料理名で検索"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-full max-w-md"
                />

                <Link href="/recipes/new" className="text-green-500 hover:underline ml-4">
                    Add Recipe
                </Link>
            </div>

            <ul>
                {filteredRecipes.length > 0 ? (
                    filteredRecipes.map((recipe) => (
                        <li key={recipe.id} className="mt-4 border-b pb-4">
                            <div className="flex items-start">
                                <img
                                    src={recipe.image || '/placeholder.png'}
                                    alt={recipe.title}
                                    className="w-24 h-24 object-cover rounded mr-4"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h2 className="text-xl font-bold mb-1">
                                            <Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link>
                                        </h2>
                                        <button
                                            onClick={() => handleDelete(recipe.id)}
                                            className="text-red-500 hover:text-red-600 w-8 h-8 ml-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="text-gray-600 line-clamp-3">
                                        {recipe.description}
                                    </p>
                                </div>
                            </div>
                        </li>
                    ))
                ) : (
                    <p>No recipes found.</p>
                )}
            </ul>
        </div>
    );
};

export default Home;
