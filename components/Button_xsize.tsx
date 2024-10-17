// components/Button.tsx

import React from 'react';

interface ButtonProps {
    label: string;               // ボタンのラベル
    bgColor?: string;            // 背景色（オプション）
    hoverColor?: string;         // ホバー時の背景色（オプション）
    onClick?: () => void;        // オプションでクリック時の処理
    type?: 'button' | 'submit';  // ボタンタイプ
}

const Button: React.FC<ButtonProps> = ({
    label,
    bgColor = 'bg-green-500',          // デフォルトの色
    hoverColor = 'hover:bg-green-600',  // デフォルトのホバー時の色
    onClick,
    type = 'button',
}) => {
    return (
        <button
            type={type}
            className={`w-[99%] h-[50px] ${bgColor} text-white px-4 py-2 rounded hover:w-[100%] ${hoverColor} transition-all duration-300 font-bold`}

            onClick={onClick}
        >
            {label}
        </button>
    );
};

export default Button;
