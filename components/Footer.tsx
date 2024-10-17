const Footer = () => {
    return (
        <footer className="bg-gray-800 text-white py-4 mt-auto">
            <div className="container mx-auto text-center">
                <p className="text-sm">
                    &copy; {new Date().getFullYear()} MyDishBook. All rights reserved.
                </p>
                <div className="flex justify-center space-x-4 mt-2 text-sm">
                    <a href="#" className="hover:underline">
                        プライバシーポリシー
                    </a>
                    <a href="#" className="hover:underline">
                        利用規約
                    </a>
                    <a href="#" className="hover:underline">
                        お問い合わせ
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
