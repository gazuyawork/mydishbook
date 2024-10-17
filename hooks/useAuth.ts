import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const useAuth = () => {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login'); // トークンがなければログインページにリダイレクト
        } else {
            setIsLoggedIn(true);
        }
    }, [router]);

    return isLoggedIn;
};
