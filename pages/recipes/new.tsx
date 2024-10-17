import { useRouter } from 'next/router';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Button from '../../components/Button_xsize';



const NewRecipe = () => {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState<{ name: string; amount: string; unit: string }[]>([{ name: '', amount: '', unit: '' }]);
    const [instructions, setInstructions] = useState<string[]>(['']);
    const [image, setImage] = useState<File | null>(null);  // 画像を保持する状態
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);  // プレビューURLを保持する状態
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);  // 選択されたファイル名

    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const instructionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    useEffect(() => {
        if (descriptionRef.current) {
            descriptionRef.current.style.height = 'auto';
            descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`;
        }
    }, [description]);

    useEffect(() => {
        instructionRefs.current.forEach((ref) => {
            if (ref) {
                ref.style.height = 'auto';
                ref.style.height = `${ref.scrollHeight}px`;
            }
        });
    }, [instructions]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        // 空でない材料と作り方をフィルタリング
        const filteredIngredients = ingredients.filter((ingredient) => ingredient.name.trim() !== '');
        const filteredInstructions = instructions.filter((instruction) => instruction.trim() !== '');
    
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('ingredients', JSON.stringify(filteredIngredients)); // JSON形式に変換して保存
        formData.append('instructions', JSON.stringify(filteredInstructions)); // JSON形式に変換して保存
        if (image) {
            formData.append('image', image);  // 選択された画像ファイルを追加
        }

        try {
            await axios.post('/api/recipes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',  // ファイルアップロードを扱う場合、必須のヘッダー
                },
            });
            router.push('/'); // 保存後、トップページにリダイレクト
        } catch (error) {
            console.error('Error creating recipe:', error);
        }
    };

    const handleIngredientChange = (index: number, field: string, value: string) => {
        const newIngredients = [...ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        setIngredients(newIngredients);

        if (index === ingredients.length - 1 && (newIngredients[index].name !== '' || newIngredients[index].amount !== '')) {
            setIngredients([...newIngredients, { name: '', amount: '', unit: '' }]);
        }
    };

    const handleInstructionChange = (index: number, value: string) => {
        const newInstructions = [...instructions];
        newInstructions[index] = value;
        setInstructions(newInstructions);

        if (index === instructions.length - 1 && value !== '') {
            setInstructions([...newInstructions, '']);
        }
    };

    const handleRemoveIngredient = (index: number) => {
        const newIngredients = ingredients.filter((_, i) => i !== index);
        setIngredients(newIngredients);
    };

    const handleRemoveInstruction = (index: number) => {
        const newInstructions = instructions.filter((_, i) => i !== index);
        setInstructions(newInstructions);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedImage = e.target.files[0];
            setImage(selectedImage);  // 選択された画像ファイルを状態に設定
            setSelectedFileName(selectedImage.name);  // 選択されたファイル名を保存

            // プレビュー用の画像URLを設定
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);  // プレビュー用にデータURLを設定
            };
            reader.readAsDataURL(selectedImage);
        }
    };

    // 画像をクリアする関数
    const clearImage = () => {
        setImage(null);
        setPreviewUrl(null);
        setSelectedFileName(null);
    };

    return (
        <div className="container mx-auto pt-20 pl-5 pr-5 max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <div className="flex items-center">
                        <label className="block font-bold mb-1">料理名は？</label>
                        <span className="ml-2 bg-red-400 text-white px-2 py-1 rounded-full text-[10px] mb-1">必須</span>
                    </div>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full under-line"
                        required
                    />
                </div>
                <div>
                    <div className="flex items-center">
                        <label className="block font-bold mb-1">どんな料理？</label>
                        {/* <span className="ml-2 bg-red-400 text-white px-2 py-1 rounded-full text-[10px] mb-1">必須</span> */}
                    </div>
                    <textarea
                        ref={descriptionRef}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full under-line mb-5"
                        rows={1}
                        required
                    />
                </div>

                {/* 画像アップロード */}
                {!previewUrl && (
                    <div>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                        <label
                            htmlFor="file-upload"
                            className="bg-gray-500 text-white px-3 py-2 rounded cursor-pointer hover:bg-gray-600 transition"
                        >
                            画像を選択
                        </label>
                        {selectedFileName && <p className="mt-2 text-gray-500">{selectedFileName}</p>}
                    </div>
                )}

                {previewUrl && (
                    <div className="relative mt-4 w-48 h-48">
                        <img
                            src={previewUrl}
                            alt="プレビュー"
                            className="w-full h-full object-cover rounded"
                        />
                        <button
                            type="button"
                            onClick={clearImage}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                        >
                            ✖
                        </button>
                    </div>
                )}

                {/* 材料入力フォーム */}
                <div>
                    <div className="flex items-center mt-10">
                        <label className="block font-bold mb-1">必要な材料は？</label>
                        <span className="ml-2 bg-red-400 text-white px-2 py-1 rounded-full text-[10px] mb-1">必須</span>
                    </div>
                    {ingredients.map((ingredient, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                            <input
                                type="text"
                                placeholder="材料名"
                                value={ingredient.name}
                                onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                                className="flex-grow basis-3/5 under-line"
                            />
                            <input
                                type="text"
                                placeholder="数量"
                                value={ingredient.amount}
                                onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                                className="basis-1/6 under-line"
                                style={{ width: '60px' }}
                            />
                            <select
                                value={ingredient.unit}
                                onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                                className="basis-1/6 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                style={{ width: '60px' }}
                            >
                                <option value="">単位</option>
                                <option value="g">g</option>
                                <option value="個">個</option>
                                <option value="ml">ml</option>
                                <option value="大さじ">大さじ</option>
                                <option value="小さじ">小さじ</option>
                            </select>
                            {ingredients.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(index)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition flex items-center justify-center w-8 h-8"
                                    tabIndex={-1}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* 作り方入力フォーム */}
                <div>
                    <div className="flex items-center">
                        <label className="block font-bold mb-1">作り方は？</label>
                        <span className="ml-2 bg-red-400 text-white px-2 py-1 rounded-full text-[10px] mb-1">必須</span>
                    </div>
                    {instructions.map((instruction, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
                            <textarea
                                placeholder="入力すると自動で項目が追加されます"
                                ref={(el) => (instructionRefs.current[index] = el)}
                                value={instruction}
                                onChange={(e) => handleInstructionChange(index, e.target.value)}
                                className="w-full under-line"
                                rows={1}
                            />
                            {instructions.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveInstruction(index)}
                                    className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition flex items-center justify-center w-8 h-8"
                                    tabIndex={-1}
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-5 flex justify-center">
                    <Button
                        label="新しいレシピを追加する"
                        bgColor="bg-green-500"
                        hoverColor="hover:bg-green-600"
                        type="submit"
                    />
                </div>

                <div className="pt-2 flex justify-center">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="text-green-400 px-4 py-2 rounded hover:text-green-500 transition"
                    >
                        追加しないで戻る
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewRecipe;
