'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { contractAddresses } from '@/lib/wagmi';
import { MEME_TOKEN_ABI } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { parseEther } from 'viem';
// Added minting logging


interface TokenMintingProps {
    imageUrl: string;
    onTokenCreated?: (tokenAddress: string) => void;
}

export function TokenMinting({ imageUrl, onTokenCreated }: TokenMintingProps) {
    const { address } = useAccount();
    const [ethAmount, setEthAmount] = useState('0.01');
    const [tokenAmount, setTokenAmount] = useState('100');

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Read token information - this component needs a specific token address
    // For now, we'll disable these reads since we don't have a specific token selected
    const { data: tokenName } = useReadContract({
        address: undefined as unknown as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'name',
    });

    const { data: tokenSymbol } = useReadContract({
        address: undefined as unknown as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'symbol',
    });

    const { data: userBalance } = useReadContract({
        address: undefined as unknown as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    const { data: quoteBuy } = useReadContract({
        address: undefined as unknown as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'quoteBuy',
        args: [parseEther(ethAmount)],
    });

    const { data: quoteSell } = useReadContract({
        address: undefined as unknown as `0x${string}`,
        abi: MEME_TOKEN_ABI,
        functionName: 'quoteSell',
        args: [parseEther(tokenAmount)],
    });

    const handleBuyTokens = async () => {
        if (!address) return;

        try {
            // This component needs a specific token address to trade
            console.log('TokenMinting component needs a specific token address to trade');
        } catch (error) {
            console.error('Error buying tokens:', error);
        }
    };

    const handleSellTokens = async () => {
        if (!address) return;

        try {
            // This component needs a specific token address to trade
            console.log('TokenMinting component needs a specific token address to trade');
        } catch (error) {
            console.error('Error selling tokens:', error);
        }
    };

    if (isSuccess) {
        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200">
                    Transaction successful! Hash: {hash}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Trade Meme Token</h3>

            {tokenName && tokenSymbol && (
                <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">{tokenName} ({tokenSymbol})</p>
                    <p className="text-xs text-muted-foreground">
                        Your balance: {userBalance ? (Number(userBalance) / 1e18).toFixed(2) : '0'} {tokenSymbol}
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">ETH Amount</label>
                    <input
                        type="number"
                        step="0.001"
                        value={ethAmount}
                        onChange={(e) => setEthAmount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="0.01"
                    />
                    {quoteBuy && (
                        <p className="text-xs text-muted-foreground mt-1">
                            You'll get ~{quoteBuy ? (Number(quoteBuy) / 1e18).toFixed(2) : '0'} tokens
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Token Amount</label>
                    <input
                        type="number"
                        step="1"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        placeholder="100"
                    />
                    {quoteSell && (
                        <p className="text-xs text-muted-foreground mt-1">
                            You'll get ~{quoteSell ? (Number(quoteSell) / 1e18).toFixed(4) : '0'} ETH
                        </p>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={handleBuyTokens}
                    disabled={isPending || isConfirming || !address}
                    className="flex-1"
                >
                    {isPending || isConfirming ? 'Buying...' : 'Buy Tokens'}
                </Button>

                <Button
                    onClick={handleSellTokens}
                    disabled={isPending || isConfirming || !address}
                    variant="outline"
                    className="flex-1"
                >
                    {isPending || isConfirming ? 'Selling...' : 'Sell Tokens'}
                </Button>
            </div>
        </div>
    );
}
