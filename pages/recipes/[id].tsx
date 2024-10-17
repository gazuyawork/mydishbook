import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Button from '../../components/Button_xsize';

interface Ingredient {
    name: string;
    amount: string;
    unit: string;
    checked?: boolean;
}

interface Recipe {
    id: number;
    title: string;
    description: string;
    ingredients: Ingredient[] | string;
    instructions: string[] | string;
    image: string | null;
}

const RecipeDetail = () => {
    const router = useRouter();
    const { id } = router.query;
    const [recipe, setRecipe] = useState<Recipe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (router.isReady && id) {
            const fetchRecipe = async () => {
                try {
                    const response = await axios.get(`/api/recipes/${id}`);
                    const data = response.data;

                    if (typeof data.ingredients === 'string') {
                        data.ingredients = JSON.parse(data.ingredients);
                    }
                    if (typeof data.instructions === 'string') {
                        data.instructions = JSON.parse(data.instructions);
                    }

                    setRecipe(data);
                } catch (error) {
                    console.error('Error fetching recipe:', error);
                    setError('レシピの取得に失敗しました。再度お試しください。');
                } finally {
                    setLoading(false);
                }
            };
            fetchRecipe();
        }
    }, [id, router.isReady]);

    const toggleCheck = (index: number) => {
        if (!recipe) return;
        const updatedIngredients = [...(recipe.ingredients as Ingredient[])];
        updatedIngredients[index].checked = !updatedIngredients[index].checked;
        setRecipe({ ...recipe, ingredients: updatedIngredients });
    };

    const clearAllChecks = () => {
        if (!recipe) return;
        const updatedIngredients = (recipe.ingredients as Ingredient[]).map((ingredient) => ({
            ...ingredient,
            checked: false,
        }));
        setRecipe({ ...recipe, ingredients: updatedIngredients });
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;
    if (!recipe) return <p>レシピが見つかりませんでした。</p>;

    const imageUrl = recipe.image
        ? `${recipe.image.startsWith('/uploads') ? recipe.image : `/uploads/${recipe.image}`}`
        : null;

    return (
        <div className="container mx-auto p-4 max-w-4xl mt-10">
            <div className="flex flex-col sm:flex-row items-start">
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={recipe.title}
                        className="w-full sm:w-1/4 h-auto object-cover rounded mb-4 mr-5 sm:mb-0 sm:ml-5"
                    />
                )}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-1">{recipe.title}</h2>
                    <p className="text-gray-600">{recipe.description}</p>
                </div>
            </div>

            <div className="flex justify-between items-center mt-4">
                <h2 className="text-2xl">材料</h2>
                <button
                    onClick={clearAllChecks}
                    className="text-red-500 hover:text-red-700 font-bold"
                >
                    すべてのチェックを解除
                </button>
            </div>

            <ul className="bg-yellow-100 p-4 bg-opacity-30">
                {Array.isArray(recipe.ingredients) &&
                    recipe.ingredients.map((ingredient, index) => (
                        <li key={index} className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={ingredient.checked || false}
                                    onChange={() => toggleCheck(index)}
                                    className="w-5 h-5 text-green-500 bg-gray-100 rounded-full border-gray-300 focus:ring-2 focus:ring-green-300 cursor-pointer"
                                />
                                <span
                                    className={`${
                                        ingredient.checked ? 'line-through text-gray-400' : ''
                                    }`}
                                >
                                    {ingredient.name}
                                </span>
                            </div>
                            <span className="text-gray-600">
                                {ingredient.amount} {ingredient.unit}
                            </span>
                        </li>
                    ))}
            </ul>

            <h2 className="text-2xl mt-4">作り方</h2>
            <ol className="bg-blue-100 p-4 bg-opacity-30">
                {Array.isArray(recipe.instructions) &&
                    recipe.instructions.map((step, index) => (
                        <li className="mb-4" key={index}>
                            {index + 1}. {step}
                        </li>
                    ))}
            </ol>

            <div className="pt-5 flex justify-center">
                <Button
                    onClick={() => router.back()}
                    label="戻る"
                    bgColor="bg-gray-500"
                    hoverColor="hover:bg-gray-600"
                    type="button"
                />
            </div>
            <div className="pt-2 flex justify-center">
                <Link href={`/recipes/edit/${recipe.id}`}>
                    <button
                        type="button"
                        className="text-green-400 px-4 py-2 rounded hover:text-green-500 transition"
                    >
                        レシピを編集する
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default RecipeDetail;
