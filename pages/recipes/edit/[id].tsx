import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const EditRecipe = () => {
    const router = useRouter();
    const { id } = router.query;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [ingredients, setIngredients] = useState([{ name: '', amount: '', unit: '' }]);
    const [instructions, setInstructions] = useState(['']);
    const [image, setImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (router.isReady && id) {
            const fetchRecipe = async () => {
                try {
                    const response = await axios.get(`/api/recipes/${id}`);
                    const { title, description, ingredients, instructions, image } = response.data;

                    setTitle(title);
                    setDescription(description);
                    setIngredients(Array.isArray(ingredients) ? ingredients : JSON.parse(ingredients));
                    setInstructions(Array.isArray(instructions) ? instructions : JSON.parse(instructions));
                    if (image) setPreviewUrl(image);
                } catch (error) {
                    console.error('レシピの取得に失敗しました:', error);
                }
            };
            fetchRecipe();
        }
    }, [id, router.isReady]);

    const filterEmptyIngredients = () => 
        ingredients.filter(({ name, amount }) => name.trim() !== '' && amount.trim() !== '');

    const filterEmptyInstructions = () => 
        instructions.filter((instruction) => instruction.trim() !== '');

    const handleIngredientChange = (index: number, field: string, value: string) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients[index] = { ...updatedIngredients[index], [field]: value };
        setIngredients(updatedIngredients);

        if (index === ingredients.length - 1 && value.trim() !== '') {
            setIngredients([...updatedIngredients, { name: '', amount: '', unit: '' }]);
        }
    };

    // const handleInstructionChange = (index: number, value: string) => {
    //     setInstructions((prevInstructions) => {
    //       const updatedInstructions = [...prevInstructions];
    //       updatedInstructions[index] = value;
      
    //       // 最後の要素が入力された場合、新しい空要素を追加
    //       if (index === prevInstructions.length - 1 && value.trim() !== '') {
    //         return [...updatedInstructions, ''];
    //       }
      
    //       return updatedInstructions;
    //     });
    //   };
      

    const handleRemoveIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const handleRemoveInstruction = (index: number) => {
        setInstructions(instructions.filter((_, i) => i !== index));
    };

    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedImage = e.target.files[0];
            setImage(selectedImage); // 画像ファイルをstateに保存
            setSelectedFileName(selectedImage.name); // 選択されたファイル名を保存
    
            const reader = new FileReader(); // FileReaderを使用して画像をプレビュー
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string); // プレビューURLをstateに保存
            };
            reader.readAsDataURL(selectedImage); // ファイルをDataURLとして読み込む
        }
    };

    const clearImage = () => {
        setImage(null); // 画像ファイルをクリア
        setPreviewUrl(null); // プレビューURLをクリア
        setSelectedFileName(null); // ファイル名をクリア
    };
    
    

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const filteredIngredients = filterEmptyIngredients();
        const filteredInstructions = filterEmptyInstructions();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('ingredients', JSON.stringify(filteredIngredients));
        formData.append('instructions', JSON.stringify(filteredInstructions));
        if (image) formData.append('image', image);

        try {
            await axios.put(`/api/recipes/${id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            router.push('/');
        } catch (error) {
            console.error('Error updating recipe:', error);
        }
    };


    const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
    const instructionRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

    // テキストエリアの高さを調整する関数
    const adjustHeight = (element: HTMLTextAreaElement | null) => {
        if (element) {
            element.style.height = 'auto';
            element.style.height = `${element.scrollHeight}px`;
        }
    };

    // 説明部分の高さ調整
    useEffect(() => {
        adjustHeight(descriptionRef.current);
    }, [description]);

    // 作り方の各ステップの高さ調整
    useEffect(() => {
        instructionRefs.current.forEach((ref) => adjustHeight(ref));
    }, [instructions]);




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
                    <label className="block font-bold mb-1">どんな料理？</label>
                    <textarea
        ref={descriptionRef}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full under-line"
        rows={1}
        style={{ overflow: 'hidden' }}
        required
    />
                </div>

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
                                className="basis-1/6 border rounded"
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
                                    className="text-red-500 hover:text-red-700 font-bold px-4 py-2 transition-colors duration-300"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div>
                    <div className="flex items-center">
                        <label className="block font-bold mb-1">作り方は？</label>
                        <span className="ml-2 bg-red-400 text-white px-2 py-1 rounded-full text-[10px] mb-1">必須</span>
                    </div>
                    {instructions.map((instruction, index) => (
                        <div key={index} className="flex space-x-2 mb-2">
        <textarea
            key={index}
            ref={(el) => (instructionRefs.current[index] = el)}
            value={instruction}
            onChange={(e) => {
                const newInstructions = [...instructions];
                newInstructions[index] = e.target.value;
                setInstructions(newInstructions);
            }}
            className="w-full under-line mb-2"
            rows={1}
            style={{ overflow: 'hidden' }}
            required
        />
                            {instructions.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveInstruction(index)}
                                    className="text-red-500 hover:text-red-700 font-bold px-4 py-2 transition-colors duration-300"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                <div className="pt-5 flex justify-center">
                    <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                        更新する
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditRecipe;
