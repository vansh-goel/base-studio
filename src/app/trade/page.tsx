"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SimpleWalletConnect } from "@/components/SimpleWalletConnect";
import { MinimalMobileNavbar } from "@/components/MinimalMobileNavbar";
import { contractAddresses } from "@/lib/wagmi";
import { MEME_TOKEN_FACTORY_ABI } from "@/lib/contracts";
import { fetchAllTokens, type TokenInfo } from "@/lib/tokenFetcher";
import { INDIVIDUAL_TOKEN_ABI } from "@/lib/individualTokenABI";
import { UniswapLiquidityManager } from "@/components/UniswapLiquidityManager";
import { parseEther } from "viem";
import { TrendingUp, TrendingDown, Activity, Users, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";

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
// Enhanced trading UX


export default function TradePage() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);
  const [buyAmount, setBuyAmount] = useState("0.01");
  const [sellAmount, setSellAmount] = useState("100");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price" | "volume">("name");
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle client-side hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Write contract hooks for buy/sell
  const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending } = useWriteContract();
  const { writeContract: writeSell, data: sellHash, isPending: isSellPending } = useWriteContract();

  const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
  });

  const { isLoading: isSellConfirming, isSuccess: isSellSuccess } = useWaitForTransactionReceipt({
    hash: sellHash,
  });

  // Fetch real token data when a token is selected
  const { data: currentPrice } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: INDIVIDUAL_TOKEN_ABI,
    functionName: "getCurrentPrice",
    query: { enabled: !!selectedToken }
  });

  const { data: contractBalance } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: INDIVIDUAL_TOKEN_ABI,
    functionName: "balanceOf",
    args: selectedToken?.address ? [selectedToken.address] : undefined,
    query: { enabled: !!selectedToken }
  });

  const { data: totalSupply } = useReadContract({
    address: selectedToken?.address as `0x${string}`,
    abi: INDIVIDUAL_TOKEN_ABI,
    functionName: "totalSupply",
    query: { enabled: !!selectedToken }
  });

  // Buy tokens function
  const handleBuyTokens = async () => {
    if (!selectedToken || !buyAmount) return;

    try {
      await writeBuy({
        address: selectedToken.address as `0x${string}`,
        abi: INDIVIDUAL_TOKEN_ABI,
        functionName: 'buyTokens',
        value: parseEther(buyAmount),
      });
    } catch (error) {
      console.error('Error buying tokens:', error);
    }
  };

  // Sell tokens function
  const handleSellTokens = async () => {
    if (!selectedToken || !sellAmount) return;

    try {
      await writeSell({
        address: selectedToken.address as `0x${string}`,
        abi: INDIVIDUAL_TOKEN_ABI,
        functionName: 'sellTokens',
        args: [parseEther(sellAmount)],
      });
    } catch (error) {
      console.error('Error selling tokens:', error);
    }
  };

  // Redirect to landing page if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/landing");
    }
  }, [isConnected, router]);

  // Filter and sort tokens
  const filteredTokens = tokens
    .filter(token =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price":
          return 0; // Would need price data
        case "volume":
          return 0; // Would need volume data
        default:
          return 0;
      }
    });

  // Read deployed tokens from factory
  const { data: deployedTokens } = useReadContract({
    address: contractAddresses.memeTokenFactory as `0x${string}`,
    abi: MEME_TOKEN_FACTORY_ABI,
    functionName: "getDeployedTokens",
  });

  // Fetch real token details from contracts
  useEffect(() => {
    const fetchTokenDetails = async () => {
      try {
        const tokenDetails = await fetchAllTokens();
        setTokens(tokenDetails);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      }
    };

    fetchTokenDetails();
  }, []);

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 rounded-full gradient-base flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">BS</span>
          </div>
          <p className="text-sm text-[var(--muted-foreground)]">Loading Trade...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return null; // Will redirect, no need to render anything
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile-Friendly Header */}
      <MinimalMobileNavbar currentPage="trade" />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-4 sm:py-6 px-4 sm:px-6">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Token List */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-4">Token Marketplace</h2>

                {/* Search and Sort */}
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tokens..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base"
                    />
                  </div>

                  <div className="flex gap-2">
                    {["name", "price", "volume"].map((sort) => (
                      <button
                        key={sort}
                        onClick={() => setSortBy(sort as any)}
                        className={`px-3 py-1 rounded-md text-sm transition-colors ${sortBy === sort
                          ? 'bg-primary text-white'
                          : 'bg-muted hover:bg-muted/80'
                          }`}
                      >
                        {sort.charAt(0).toUpperCase() + sort.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="space-y-3">
                <AnimatePresence>
                  {filteredTokens.length > 0 ? (
                    filteredTokens.map((token, index) => (
                      <motion.div
                        key={token.address}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:shadow-lg ${selectedToken?.address === token.address
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        onClick={() => setSelectedToken(token)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl gradient-base flex items-center justify-center">
                            <span className="font-bold text-white">{token.symbol.slice(0, 2)}</span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{token.name}</h3>
                            <p className="text-sm text-muted-foreground">{token.symbol}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Activity className="w-3 h-3 text-green-500" />
                              <span className="text-xs text-green-600">Active</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="p-8 text-center border rounded-xl"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Zap className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">No tokens available yet</p>
                      <p className="text-sm mt-2">Create your first token in the Studio!</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Trading Interface */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {selectedToken ? (
                  <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Token Header - Mobile Responsive */}
                    <motion.div
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl gradient-base-subtle"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl gradient-base flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl font-bold text-white">{selectedToken.symbol.slice(0, 2)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-2xl sm:text-3xl font-bold truncate">{selectedToken.name}</h2>
                        <p className="text-base sm:text-lg text-muted-foreground">{selectedToken.symbol}</p>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-600">Live Trading</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-blue-600">Active Market</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Token Description */}
                    <motion.div
                      className="p-6 rounded-2xl border border-border bg-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <p className="text-muted-foreground mb-6">{selectedToken.description}</p>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
                        {/* Buy Section - Mobile Responsive */}
                        <motion.div
                          className="space-y-4 sm:space-y-6 p-4 sm:p-6 rounded-xl border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.3 }}
                        >
                          <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Buy Tokens</h3>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-green-700 dark:text-green-300">ETH Amount</label>
                              <div className="flex flex-col sm:flex-row mt-2 gap-2 sm:gap-0">
                                <input
                                  type="number"
                                  value={buyAmount}
                                  onChange={(e) => setBuyAmount(e.target.value)}
                                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-green-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-background focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                                  min="0.001"
                                  step="0.001"
                                />
                                <div className="px-3 py-2 sm:px-4 sm:py-3 border border-green-300 rounded-lg sm:rounded-l-none sm:rounded-r-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 font-medium flex items-center justify-center">
                                  ETH
                                </div>
                              </div>
                              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                Estimated tokens: ~{currentPrice ? (Number(buyAmount) * Number(currentPrice) / 1e18).toFixed(2) : 'Calculating...'} {selectedToken.symbol}
                              </p>
                            </div>
                            <Button
                              className="w-full gradient-base hover:opacity-90"
                              onClick={handleBuyTokens}
                              disabled={isBuyPending || isBuyConfirming || !selectedToken}
                            >
                              {isBuyPending || isBuyConfirming ? 'Buying...' : 'Buy Tokens'}
                            </Button>
                          </div>
                        </motion.div>

                        {/* Sell Section - Mobile Responsive */}
                        <motion.div
                          className="space-y-4 sm:space-y-6 p-4 sm:p-6 rounded-xl border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.4 }}
                        >
                          <div className="flex items-center gap-2">
                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Sell Tokens</h3>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-red-700 dark:text-red-300">Token Amount</label>
                              <div className="flex flex-col sm:flex-row mt-2 gap-2 sm:gap-0">
                                <input
                                  type="number"
                                  value={sellAmount}
                                  onChange={(e) => setSellAmount(e.target.value)}
                                  className="flex-1 px-3 py-2 sm:px-4 sm:py-3 border border-red-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none bg-background focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                                  min="1"
                                  step="1"
                                />
                                <div className="px-3 py-2 sm:px-4 sm:py-3 border border-red-300 rounded-lg sm:rounded-l-none sm:rounded-r-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 font-medium flex items-center justify-center">
                                  {selectedToken.symbol}
                                </div>
                              </div>
                              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                Estimated ETH: ~{currentPrice ? (Number(sellAmount) / (Number(currentPrice) / 1e18)).toFixed(6) : 'Calculating...'} ETH
                              </p>
                            </div>
                            <Button
                              className="w-full"
                              variant="destructive"
                              onClick={handleSellTokens}
                              disabled={isSellPending || isSellConfirming || !selectedToken}
                            >
                              {isSellPending || isSellConfirming ? 'Selling...' : 'Sell Tokens'}
                            </Button>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Transaction Status */}
                    <AnimatePresence>
                      {(isBuySuccess || isSellSuccess) && (
                        <motion.div
                          className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-green-800 dark:text-green-200 font-semibold">
                                {isBuySuccess ? 'Tokens purchased successfully!' : 'Tokens sold successfully!'}
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-300">
                                Transaction hash: {buyHash || sellHash}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Market Stats */}
                    <motion.div
                      className="grid grid-cols-2 lg:grid-cols-4 gap-6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <p className="text-sm text-muted-foreground">Current Price</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {currentPrice ? `${(Number(currentPrice) / 1e18).toFixed(6)} tokens/ETH` : 'Loading...'}
                        </p>
                      </div>
                      <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-4 h-4 text-blue-500" />
                          <p className="text-sm text-muted-foreground">Contract Balance</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {contractBalance ? `${(Number(contractBalance) / 1e18).toFixed(2)} ${selectedToken?.symbol}` : 'Loading...'}
                        </p>
                      </div>
                      <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-purple-500" />
                          <p className="text-sm text-muted-foreground">Total Supply</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {totalSupply ? `${(Number(totalSupply) / 1e18).toFixed(0)} ${selectedToken?.symbol}` : 'Loading...'}
                        </p>
                      </div>
                      <div className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <p className="text-sm text-muted-foreground">ETH in Contract</p>
                        </div>
                        <p className="text-2xl font-bold">
                          {selectedToken ? 'Check contract balance' : 'Select token'}
                        </p>
                      </div>
                    </motion.div>

                    {/* Uniswap V3 Liquidity Section */}
                    <motion.div
                      className="mt-8 p-6 rounded-2xl border border-border bg-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 }}
                    >
                      <h3 className="text-xl font-semibold mb-6">Liquidity Management</h3>
                      <UniswapLiquidityManager
                        tokenAddress={selectedToken.address}
                        tokenSymbol={selectedToken.symbol}
                      />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="h-full flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="text-center p-12">
                      <div className="w-24 h-24 mx-auto mb-6 rounded-2xl gradient-base flex items-center justify-center">
                        <TrendingUp className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold mb-4">Select a Token</h2>
                      <p className="text-lg text-muted-foreground">Choose a token from the list to view trading options</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}