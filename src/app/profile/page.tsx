// NFT and experience system - 2025-10-24T15:36:53.216Z
"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WalletConnect } from "@/components/WalletConnect";
import { contractAddresses } from "@/lib/wagmi";
import { MEME_TOKEN_FACTORY_ABI, EXPERIENCE_NFT_ABI } from "@/lib/contracts";
import { ExperienceNFT } from "@/components/ExperienceNFT";
import { fetchUserTokens, fetchUserNFTs, type TokenInfo, type NFTInfo } from "@/lib/tokenFetcher";
import { User, Camera, Zap, Trophy, Star, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

const ThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then((mod) => ({ default: mod.ThemeToggle })),
  {
    ssr: false,
    loading: () => (
      <div className="h-9 w-20 rounded-full border border-[var(--border)] bg-[var(--card)] opacity-80" aria-hidden />
    ),
  }
);

// Types are now imported from tokenFetcher
// Enhanced profile functionality


export default function ProfilePage() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [userTokens, setUserTokens] = useState<TokenInfo[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFTInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts' | 'mint'>('tokens');
  const [basename, setBasename] = useState<string | null>(null);
  const [totalXP, setTotalXP] = useState(0);
  const [totalCreations, setTotalCreations] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect to landing page if not connected
  useEffect(() => {
    if (isMounted && !isConnected) {
      router.push("/landing");
    }
  }, [isConnected, router, isMounted]);

  // Read deployed tokens from factory
  const { data: deployedTokens } = useReadContract({
    address: contractAddresses.memeTokenFactory as `0x${string}`,
    abi: MEME_TOKEN_FACTORY_ABI,
    functionName: "getDeployedTokens",
  });

  // Read NFT balance
  const { data: nftBalance } = useReadContract({
    address: contractAddresses.experienceNFT as `0x${string}`,
    abi: EXPERIENCE_NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  // Fetch real token details from contracts
  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!address) return;

      try {
        const tokens = await fetchUserTokens(address);
        setUserTokens(tokens);
        setTotalCreations(tokens.length);
      } catch (error) {
        console.error('Error fetching user tokens:', error);
      }
    };

    fetchTokenDetails();
  }, [address]);

  // Simulate Basename lookup (in real app, this would come from OnchainKit)
  useEffect(() => {
    if (address) {
      // Mock Basename - in real app, this would be fetched from OnchainKit
      const mockBasename = `creator${address.slice(2, 6)}.base`;
      setBasename(mockBasename);
    }
  }, [address]);

  // Fetch real NFT details from contracts and Lighthouse
  useEffect(() => {
    const fetchNFTDetails = async () => {
      if (!nftBalance || nftBalance === 0n || !address) return;

      try {
        const nftCount = Number(nftBalance);
        const nfts = await fetchUserNFTs(address, nftCount);
        setUserNFTs(nfts);

        // Calculate total XP
        const total = nfts.reduce((sum, nft) => sum + nft.experience, 0);
        setTotalXP(total);
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
      }
    };

    fetchNFTDetails();
  }, [nftBalance, address]);

  const getLevel = (xp: number) => {
    if (xp < 100) return "Apprentice";
    if (xp < 300) return "Artisan";
    if (xp < 600) return "Maestro";
    return "Visionary";
  };

  // Show loading state during hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="border-b border-border bg-background">
          <div className="container mx-auto flex justify-between items-center py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-9 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-9 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        <main className="flex-1 container mx-auto py-8 px-4">
          <div className="animate-pulse">
            <div className="h-32 w-full bg-muted rounded-2xl mb-8" />
            <div className="h-8 w-48 bg-muted rounded mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-2xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!isConnected) {
    return null; // Will redirect, no need to render anything
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <motion.header
        className="border-b border-border bg-background"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto flex justify-between items-center py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full gradient-base flex items-center justify-center">
              <span className="text-white font-bold text-sm">BS</span>
            </div>
            <h1 className="text-xl font-semibold">Base Studio</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="/studio" className="text-sm font-medium hover:text-primary transition-colors">Studio</a>
              <a href="/trade" className="text-sm font-medium hover:text-primary transition-colors">Trade</a>
              <a href="/profile" className="text-sm font-medium text-primary">Profile</a>
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4">
        {/* Profile Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl gradient-base flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-3xl font-bold">
                    {basename || `Creator ${address?.slice(2, 6)}`}
                  </h2>
                  {basename && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Basename</span>
                    </div>
                  )}
                </div>
                <p className="text-muted-foreground text-lg">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {basename ? 'Verified Creator on Base' : 'Base Studio Creator'}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-4 ml-auto">
              <motion.div
                className="p-4 rounded-xl border border-border bg-card text-center min-w-[100px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                  <Camera className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold">{totalCreations}</p>
                <p className="text-xs text-muted-foreground">Creations</p>
              </motion.div>

              <motion.div
                className="p-4 rounded-xl border border-border bg-card text-center min-w-[100px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <Trophy className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold">{totalXP}</p>
                <p className="text-xs text-muted-foreground">XP</p>
              </motion.div>

              <motion.div
                className="p-4 rounded-xl border border-border bg-card text-center min-w-[100px]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold">{userNFTs.length}</p>
                <p className="text-xs text-muted-foreground">NFTs</p>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          className="border-b border-border mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex space-x-8">
            {[
              { id: 'tokens', label: 'My Tokens', icon: Zap },
              { id: 'nfts', label: 'Experience NFTs', icon: Trophy },
              { id: 'mint', label: 'Mint NFT', icon: Star }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                className={`flex items-center gap-2 pb-3 font-medium transition-colors ${activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'tokens' ? (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTokens.length > 0 ? (
                  userTokens.map((token, index) => (
                    <motion.div
                      key={token.address}
                      className="border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="h-40 gradient-base-subtle flex items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl gradient-base flex items-center justify-center">
                          <span className="text-3xl font-bold text-white">{token.symbol.slice(0, 2)}</span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{token.name}</h3>
                            <p className="text-sm text-muted-foreground">{token.symbol}</p>
                          </div>
                          {token.isCreator && (
                            <span className="px-3 py-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full">
                              Creator
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{token.description}</p>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="font-semibold">{token.balance} {token.symbol}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="base"
                            onClick={() => router.push(`/trade?token=${token.address}`)}
                            className="flex items-center gap-1"
                          >
                            <TrendingUp className="w-3 h-3" />
                            Trade
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="col-span-full p-12 text-center border rounded-2xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-base flex items-center justify-center">
                      <Zap className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No tokens yet</h3>
                    <p className="text-muted-foreground mb-6">Start creating to build your token portfolio</p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => router.push('/studio')} className="flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Create Token
                      </Button>
                      <Button variant="outline" onClick={() => router.push('/trade')} className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Buy Tokens
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'nfts' ? (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userNFTs.length > 0 ? (
                  userNFTs.map((nft, index) => (
                    <motion.div
                      key={nft.tokenId}
                      className="border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      <div className="h-40 gradient-base-subtle flex items-center justify-center">
                        <div className="w-24 h-24 rounded-2xl gradient-base flex items-center justify-center">
                          <Trophy className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">Experience NFT #{nft.tokenId}</h3>
                            <p className="text-sm text-muted-foreground">Level: {nft.level}</p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-muted-foreground">Experience</p>
                            <p className="text-sm font-semibold">{nft.experience} XP</p>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3">
                            <div
                              className="gradient-base h-3 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(nft.experience / 10, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button size="sm" variant="outline" className="w-full flex items-center gap-2">
                            <ArrowRight className="w-3 h-3" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="col-span-full p-12 text-center border rounded-2xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-base flex items-center justify-center">
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Experience NFTs yet</h3>
                    <p className="text-muted-foreground mb-6">Mint your first NFT to start tracking your creative journey</p>
                    <Button onClick={() => setActiveTab('mint')} className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Mint Your First NFT
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="rounded-2xl border border-border bg-card p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-base flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-semibold mb-2">Mint Experience NFT</h2>
                  <p className="text-muted-foreground">Mint an Experience NFT to track your creative journey and showcase your achievements</p>
                </div>
                <ExperienceNFT />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}