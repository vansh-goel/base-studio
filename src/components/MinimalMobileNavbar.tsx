'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Camera, TrendingUp, User, Home } from 'lucide-react';
import { SimpleWalletConnect } from './SimpleWalletConnect';
import { ThemeToggle } from './theme-toggle';
import { useDisconnect } from 'wagmi';
import { LogOut } from 'lucide-react';
import { useUserPhoto } from '@/lib/useUserPhoto';

interface MinimalMobileNavbarProps {
    currentPage?: string;
}

export function MinimalMobileNavbar({ currentPage = 'studio' }: MinimalMobileNavbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const router = useRouter();
    const { userPhotoUrl } = useUserPhoto();

    // Debug: Log user photo URL
    useEffect(() => {
        console.log('Navbar - userPhotoUrl changed:', userPhotoUrl);
        console.log('Navbar - userPhotoUrl type:', typeof userPhotoUrl);
        console.log('Navbar - userPhotoUrl length:', userPhotoUrl?.length);
    }, [userPhotoUrl]);

    const navItems = [
        { name: 'Studio', href: '/studio', icon: Camera, current: currentPage === 'studio' },
        { name: 'Trade', href: '/trade', icon: TrendingUp, current: currentPage === 'trade' },
        { name: 'Profile', href: '/profile', icon: User, current: currentPage === 'profile' },
    ];

    const handleNavClick = (href: string) => {
        router.push(href);
        setIsOpen(false);
    };

    return (
        <>
            {/* Minimal Mobile Header */}
            <header className="lg:hidden border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-50">
                <div className="flex items-center justify-between px-3 py-2">
                    {/* Logo - Minimal */}
                    <div className="flex items-center gap-2">
                        {userPhotoUrl ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--border)]">
                                <img
                                    src={userPhotoUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full gradient-base flex items-center justify-center">
                                <span className="text-white font-bold text-xs">BS</span>
                            </div>
                        )}
                        <h1 className="text-sm font-semibold">Base Studio</h1>
                    </div>

                    {/* Right side - Ultra Minimal */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Minimal Mobile Navigation Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-[var(--border)] bg-[var(--background)]"
                        >
                            <nav className="px-3 py-2 space-y-1">
                                {/* Wallet Connection - Only show if not connected */}
                                {!isConnected && (
                                    <div className="mb-3 pb-3 border-b border-[var(--border)]">
                                        <SimpleWalletConnect />
                                    </div>
                                )}

                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => handleNavClick(item.href)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-colors text-sm ${item.current
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'hover:bg-[var(--muted)]'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="font-medium">{item.name}</span>
                                        </button>
                                    );
                                })}

                                {/* Theme Toggle and Disconnect */}
                                <div className="mt-3 pt-3 border-t border-[var(--border)]">
                                    <div className="flex flex-row gap-2">
                                        <div className="flex-1">
                                            <ThemeToggle />
                                        </div>
                                        {isConnected && (
                                            <button
                                                onClick={() => {
                                                    disconnect();
                                                    setIsOpen(false);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-colors text-sm hover:bg-[var(--muted)] text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span className="font-medium">Disconnect</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Desktop Header - Hidden on mobile */}
            <header className="hidden lg:block border-b border-[var(--border)] bg-[var(--background)]">
                <div className="container mx-auto flex justify-between items-center py-3 px-4">
                    <div className="flex items-center gap-3">
                        {userPhotoUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--border)]">
                                <img
                                    src={userPhotoUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-8 h-8 rounded-full gradient-base flex items-center justify-center">
                                <span className="text-white font-bold text-sm">BS</span>
                            </div>
                        )}
                        <h1 className="text-xl font-semibold">Base Studio</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <nav className="flex items-center gap-6">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => handleNavClick(item.href)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${item.current
                                            ? 'text-primary bg-primary/10'
                                            : 'hover:text-primary'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {item.name}
                                    </button>
                                );
                            })}
                        </nav>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <SimpleWalletConnect />
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}
