// Blockchain-compliant trading system
// Uses MemeToken's built-in bonding curve trading (not separate trading contract)

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { contractAddresses } from './wagmi';

// ABI for MemeToken's built-in trading functions
export const MEME_TOKEN_TRADING_ABI = [
    // Trading functions (built into MemeToken)
    {
        "inputs": [],
        "name": "buyTokens",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }],
        "name": "sellTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "addLiquidity",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },

    // Price and liquidity functions
    {
        "inputs": [],
        "name": "getCurrentPrice",
        "outputs": [{ "internalType": "uint256", "name": "tokensPerETH", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "ethAmount", "type": "uint256" }],
        "name": "quoteBuy",
        "outputs": [{ "internalType": "uint256", "name": "tokensPerETH", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "tokenAmount", "type": "uint256" }],
        "name": "quoteSell",
        "outputs": [{ "internalType": "uint256", "name": "tokensPerETH", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Token info functions
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Events
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "purchaser", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "pricePerToken", "type": "uint256" }
        ],
        "name": "TokensPurchased",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "seller", "type": "address" },
            { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
            { "indexed": false, "internalType": "uint256", "name": "pricePerToken", "type": "uint256" }
        ],
        "name": "TokensSold",
        "type": "event"
    }
];

export interface OnChainMarketData {
    price: number;
    volume24h: number;
    marketCap: number;
    priceChange24h: number;
    ethLiquidity: number;
    tokenLiquidity: number;
}

// Hook for on-chain trading using MemeToken's built-in functions
export function useOnChainTrading(tokenAddress: string) {
    const { address } = useAccount();

    // Read current price from MemeToken
    const { data: currentPrice, refetch: refetchPrice } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: MEME_TOKEN_TRADING_ABI,
        functionName: 'getCurrentPrice',
        query: { enabled: !!tokenAddress }
    });

    // Read token supply and balance
    const { data: totalSupply, refetch: refetchSupply } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: MEME_TOKEN_TRADING_ABI,
        functionName: 'totalSupply',
        query: { enabled: !!tokenAddress }
    });

    const { data: contractTokenBalance, refetch: refetchBalance } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: MEME_TOKEN_TRADING_ABI,
        functionName: 'balanceOf',
        args: [tokenAddress as `0x${string}`],
        query: { enabled: !!tokenAddress }
    });

    // Get user's token balance
    const { data: userBalance, refetch: refetchUserBalance } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: MEME_TOKEN_TRADING_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!tokenAddress && !!address }
    });

    // Write contracts for trading (direct to MemeToken)
    const { writeContract: writeBuy, data: buyHash, isPending: isBuyPending } = useWriteContract();
    const { writeContract: writeSell, data: sellHash, isPending: isSellPending } = useWriteContract();

    // Wait for transaction confirmations
    const { isLoading: isBuyConfirming, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
        hash: buyHash,
    });

    const { isLoading: isSellConfirming, isSuccess: isSellSuccess } = useWaitForTransactionReceipt({
        hash: sellHash,
    });

    // Buy tokens function (direct to MemeToken)
    const buyTokens = async (ethAmount: string) => {
        if (!tokenAddress || !address) return;

        try {
            await writeBuy({
                address: tokenAddress as `0x${string}`,
                abi: MEME_TOKEN_TRADING_ABI,
                functionName: 'buyTokens',
                value: parseEther(ethAmount)
            });
        } catch (error) {
            console.error('Buy error:', error);
            throw error;
        }
    };

    // Sell tokens function (direct to MemeToken)
    const sellTokens = async (tokenAmount: string) => {
        if (!tokenAddress || !address) return;

        try {
            await writeSell({
                address: tokenAddress as `0x${string}`,
                abi: MEME_TOKEN_TRADING_ABI,
                functionName: 'sellTokens',
                args: [parseEther(tokenAmount)]
            });
        } catch (error) {
            console.error('Sell error:', error);
            throw error;
        }
    };

    // Format market data from MemeToken's bonding curve
    const formattedMarketData: OnChainMarketData | null = currentPrice ? {
        // getCurrentPrice returns tokens per ETH, so we need to invert it for ETH per token
        price: Number(formatEther(currentPrice as bigint)) > 0 ? 1 / Number(formatEther(currentPrice as bigint)) : 0,
        volume24h: 0, // Not tracked in MemeToken
        marketCap: totalSupply ? Number(formatEther(totalSupply as bigint)) * (Number(formatEther(currentPrice as bigint)) > 0 ? 1 / Number(formatEther(currentPrice as bigint)) : 0) : 0,
        priceChange24h: 0, // Not tracked in MemeToken
        ethLiquidity: 0, // Would need to read contract ETH balance
        tokenLiquidity: contractTokenBalance ? Number(formatEther(contractTokenBalance as bigint)) : 0
    } : null;

    // Helper function to get quote for buy
    const getBuyQuote = async (ethAmount: string) => {
        if (!tokenAddress) return null;
        try {
            // getCurrentPrice returns tokens per ETH, so we can use it directly for buy quotes
            const tokensPerETH = currentPrice ? Number(formatEther(currentPrice as bigint)) : 0;
            return tokensPerETH > 0 ? Number(ethAmount) * tokensPerETH : 0;
        } catch (error) {
            console.error('Error getting buy quote:', error);
            return null;
        }
    };

    // Helper function to get quote for sell
    const getSellQuote = async (tokenAmount: string) => {
        if (!tokenAddress) return null;
        try {
            // getCurrentPrice returns tokens per ETH, so we need to invert it for sell quotes
            const tokensPerETH = currentPrice ? Number(formatEther(currentPrice as bigint)) : 0;
            return tokensPerETH > 0 ? Number(tokenAmount) / tokensPerETH : 0;
        } catch (error) {
            console.error('Error getting sell quote:', error);
            return null;
        }
    };

    return {
        marketData: formattedMarketData,
        isLoading: isBuyPending || isSellPending || isBuyConfirming || isSellConfirming,
        isBuySuccess,
        isSellSuccess,
        buyTokens,
        sellTokens,
        buyHash,
        sellHash,
        userBalance: userBalance ? Number(formatEther(userBalance as bigint)) : 0,
        contractBalance: contractTokenBalance ? Number(formatEther(contractTokenBalance as bigint)) : 0,
        getBuyQuote,
        getSellQuote,
        refetchData: () => {
            refetchPrice();
            refetchSupply();
            refetchBalance();
            refetchUserBalance();
        }
    };
}
