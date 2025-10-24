// React hook for trading system integration
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { tradingSystem, type TradingData, type TradeHistory } from './tradingSystem';
import { useToast } from './toast-context';

export interface TradingHookResult {
    marketData: TradingData | null;
    priceHistory: Array<{ timestamp: number, price: number }>;
    tradeHistory: TradeHistory[];
    isLoading: boolean;
    error: string | null;
    buyTokens: (ethAmount: string) => Promise<boolean>;
    sellTokens: (tokenAmount: string) => Promise<boolean>;
    refreshData: () => void;
}

export function useTrading(tokenAddress: string): TradingHookResult {
    const { address } = useAccount();
    const toast = useToast();
    const [marketData, setMarketData] = useState<TradingData | null>(null);
    const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: number, price: number }>>([]);
    const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize token if not exists
    useEffect(() => {
        if (tokenAddress && !tradingSystem.getMarketData(tokenAddress)) {
            // Initialize with random starting price between 0.0001 and 0.01 ETH
            const initialPrice = 0.0001 + Math.random() * 0.0099;
            tradingSystem.initializeToken(tokenAddress, initialPrice);
        }
    }, [tokenAddress]);

    // Update market data periodically
    useEffect(() => {
        if (!tokenAddress) return;

        const updateData = () => {
            const data = tradingSystem.getMarketData(tokenAddress);
            const history = tradingSystem.getPriceHistory(tokenAddress, 24);
            const trades = tradingSystem.getTradeHistory(tokenAddress, 20);

            setMarketData(data);
            setPriceHistory(history);
            setTradeHistory(trades);
        };

        // Initial load
        updateData();

        // Update every 5 seconds
        const interval = setInterval(updateData, 5000);

        return () => clearInterval(interval);
    }, [tokenAddress]);

    const buyTokens = useCallback(async (ethAmount: string): Promise<boolean> => {
        if (!address || !tokenAddress) {
            toast.error('Error', 'Wallet not connected');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const ethValue = parseFloat(ethAmount);
            if (ethValue <= 0) {
                throw new Error('Invalid amount');
            }

            const result = await tradingSystem.buyTokens(tokenAddress, ethValue, address);

            if (result.success) {
                toast.success(
                    'Buy Order Executed',
                    `Received ${result.tokensReceived.toFixed(2)} tokens at ${result.newPrice.toFixed(6)} ETH each`
                );

                // Refresh data
                const data = tradingSystem.getMarketData(tokenAddress);
                setMarketData(data);

                return true;
            } else {
                throw new Error('Buy order failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            toast.error('Buy Failed', errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [address, tokenAddress, toast]);

    const sellTokens = useCallback(async (tokenAmount: string): Promise<boolean> => {
        if (!address || !tokenAddress) {
            toast.error('Error', 'Wallet not connected');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const tokenValue = parseFloat(tokenAmount);
            if (tokenValue <= 0) {
                throw new Error('Invalid amount');
            }

            const result = await tradingSystem.sellTokens(tokenAddress, tokenValue, address);

            if (result.success) {
                toast.success(
                    'Sell Order Executed',
                    `Received ${result.ethReceived.toFixed(6)} ETH at ${result.newPrice.toFixed(6)} ETH per token`
                );

                // Refresh data
                const data = tradingSystem.getMarketData(tokenAddress);
                setMarketData(data);

                return true;
            } else {
                throw new Error('Sell order failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            toast.error('Sell Failed', errorMessage);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [address, tokenAddress, toast]);

    const refreshData = useCallback(() => {
        if (!tokenAddress) return;

        const data = tradingSystem.getMarketData(tokenAddress);
        const history = tradingSystem.getPriceHistory(tokenAddress, 24);
        const trades = tradingSystem.getTradeHistory(tokenAddress, 20);

        setMarketData(data);
        setPriceHistory(history);
        setTradeHistory(trades);
    }, [tokenAddress]);

    return {
        marketData,
        priceHistory,
        tradeHistory,
        isLoading,
        error,
        buyTokens,
        sellTokens,
        refreshData
    };
}

// Hook for market statistics
export function useMarketStats() {
    const [stats, setStats] = useState(tradingSystem.getMarketStats());

    useEffect(() => {
        const updateStats = () => {
            setStats(tradingSystem.getMarketStats());
        };

        updateStats();
        const interval = setInterval(updateStats, 10000); // Update every 10 seconds

        return () => clearInterval(interval);
    }, []);

    return stats;
}
