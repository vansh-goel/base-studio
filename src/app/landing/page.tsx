"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { WalletConnect, OnchainKitConnect } from "@/components/WalletConnect";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Zap, Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import Hero3D from "@/components/Hero3D";

const ThemeToggle = dynamic(
    () => import("@/components/theme-toggle").then((mod) => ({ default: mod.ThemeToggle })),
// Enhanced landing UX

    {
        ssr: false,
        loading: () => (
            <div className="h-9 w-20 rounded-full border border-[var(--border)] bg-[var(--card)] opacity-80" aria-hidden />
        ),
    }
);

export default function LandingPage() {
    const { isConnected } = useAccount();
    const router = useRouter();
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Check if user is already connected and redirect to studio immediately
    useEffect(() => {
        if (isConnected && !isTransitioning) {
            setIsTransitioning(true);
            router.replace("/studio");
        }
    }, [isConnected, router, isTransitioning]);

    const handleWalletConnect = () => {
        if (isConnected) {
            setIsTransitioning(true);
            router.replace("/studio");
        }
    };

    const features = [
        {
            icon: Camera,
            title: "AI-Powered Editing",
            description: "Professional RAW image editing with AI enhancement tools",
            color: "text-blue-600",
            bgColor: "bg-blue-100 dark:bg-blue-900/20"
        },
        {
            icon: Zap,
            title: "Instant Tokenization",
            description: "Transform your creations into tradeable meme tokens",
            color: "text-purple-600",
            bgColor: "bg-purple-100 dark:bg-purple-900/20"
        },
        {
            icon: TrendingUp,
            title: "DeFi Marketplace",
            description: "Trade tokens with Uniswap V3 liquidity pools",
            color: "text-green-600",
            bgColor: "bg-green-100 dark:bg-green-900/20"
        },
        {
            icon: Users,
            title: "Creator Economy",
            description: "Build reputation and earn from your creative work",
            color: "text-cyan-600",
            bgColor: "bg-cyan-100 dark:bg-cyan-900/20"
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
            {/* Header */}
            <motion.header
                className="flex justify-between items-center p-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-base flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Base Studio
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <WalletConnect onConnect={handleWalletConnect} />
                </div>
            </motion.header>

            {/* Hero Section */}
            <main className="flex-1 px-6 py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            className="space-y-8"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <div className="space-y-6">
                                <motion.div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                >
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium text-primary">Built on Base</span>
                                </motion.div>

                                <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                                    Onchain Editor &{" "}
                                    <span className="bg-gradient-to-r">
                                        Marketplace
                                    </span>
                                </h1>

                                <p className="text-xl text-muted-foreground max-w-lg">
                                    The first decentralized platform for photographers to edit, tokenize, and trade their creative work on Base.
                                </p>
                            </div>

                            <motion.div
                                className="flex flex-col sm:flex-row gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <WalletConnect onConnect={handleWalletConnect} />
                                <motion.button
                                    className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <span>Learn More</span>
                                    <ArrowRight className="w-4 h-4" />
                                </motion.button>
                            </motion.div>

                            {isConnected && (
                                <motion.div
                                    className="flex items-center gap-2 text-green-600"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                                    <span className="font-medium">Wallet Connected! Redirecting to studio...</span>
                                </motion.div>
                            )}
                        </motion.div>

                        {/* 3D Hero Section */}
                        <motion.div
                            className="relative"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                        >
                            <Hero3D />
                        </motion.div>
                    </div>

                    {/* Features Section */}
                    <motion.div
                        className="mt-24"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-bold mb-4">Empowering the Creator Economy</h2>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Professional tools for photographers to create, edit, and monetize their work onchain
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    className="p-6 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all duration-300 group"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                        <feature.icon className={`w-6 h-6 ${feature.color}`} />
                                    </div>
                                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* CTA Section */}
                    <motion.div
                        className="mt-24 text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                    >
                        <div className="p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700">
                            <h3 className="text-3xl font-bold mb-4">Ready to Start Creating?</h3>
                            <p className="text-xl mb-8 opacity-90">
                                Join the future of decentralized photography
                            </p>
                            <div className="flex justify-center">
                                <WalletConnect onConnect={handleWalletConnect} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <motion.footer
                className="p-6 text-center text-sm text-muted-foreground border-t border-border"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
            >
                <p>Base Studio - Empowering Creators on Base</p>
            </motion.footer>
        </div>
    );
}
