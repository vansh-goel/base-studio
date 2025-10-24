'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Camera, TrendingUp, User, Home } from 'lucide-react';
import { SimpleWalletConnect } from './SimpleWalletConnect';
import { ThemeToggle } from './theme-toggle';

interface MobileNavbarProps {
    currentPage?: string;
}

export function MobileNavbar({ currentPage = 'studio' }: MobileNavbarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { isConnected } = useAccount();
    const router = useRouter();

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
            {/* Mobile Header */}
            <header className="lg:hidden border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-50">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-base flex items-center justify-center">
                            <span className="text-white font-bold text-sm">BS</span>
                        </div>
                        <h1 className="text-lg font-semibold">Base Studio</h1>
                    </div>

                    {/* Right side - Theme toggle and Menu */}
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        {isConnected && (
                            <SimpleWalletConnect />
                        )}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-[var(--border)] bg-[var(--background)]"
                        >
                            <nav className="px-4 py-4 space-y-2">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.name}
                                            onClick={() => handleNavClick(item.href)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${item.current
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'hover:bg-[var(--muted)]'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="font-medium">{item.name}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* Desktop Header - Hidden on mobile */}
            <header className="hidden lg:block border-b border-[var(--border)] bg-[var(--background)]">
                <div className="container mx-auto flex justify-between items-center py-3 px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full gradient-base flex items-center justify-center">
                            <span className="text-white font-bold text-sm">BS</span>
                        </div>
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
