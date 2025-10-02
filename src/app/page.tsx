"use client";

import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
// Added homepage validation


export default function Home() {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        if (isConnected) {
            router.push('/studio');
        } else {
            router.push('/landing');
        }
    }, [isConnected, router, isHydrated]);

    // Show loading while hydrating and redirecting
    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
            <div className="text-center">
                <div className="w-8 h-8 rounded-full gradient-base flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-sm">BS</span>
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">Loading Base Studio...</p>
            </div>
        </div>
    );
}
