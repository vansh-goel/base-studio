'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractAddresses } from '@/lib/wagmi';
import { UNISWAP_V3_LIQUIDITY_ABI } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
import { parseEther } from 'viem';
// Improved error handling for liquidity-creator


interface LiquidityPoolCreatorProps {
    tokenAddress: string;
    onPoolCreated?: (tokenId: string) => void;
}

export function LiquidityPoolCreator({ tokenAddress, onPoolCreated }: LiquidityPoolCreatorProps) {
    const { address } = useAccount();
    const [daiAmount, setDaiAmount] = useState('100');
    const [ethAmount, setEthAmount] = useState('0.1');

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createLiquidityPool = async () => {
        if (!address || !contractAddresses.uniswapV3Liquidity) return;

        try {
            await writeContract({
                address: contractAddresses.uniswapV3Liquidity as `0x${string}`,
                abi: UNISWAP_V3_LIQUIDITY_ABI,
                functionName: 'mintNewPosition',
                args: [
                    parseEther(daiAmount),
                    parseEther(ethAmount)
                ],
            });
        } catch (error) {
            console.error('Error creating liquidity pool:', error);
        }
    };

    if (isSuccess && hash) {
        // In a real implementation, you would get the tokenId from the transaction receipt
        const simulatedTokenId = '123456';

        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                    Liquidity pool created successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    Your liquidity position has been created on Uniswap V3.
                </p>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => onPoolCreated?.(simulatedTokenId)}>
                        View Position
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(`https://sepolia.basescan.org/tx/${hash}`, '_blank')}>
                        View Transaction
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Create Liquidity Pool</h3>

            <p className="text-sm text-muted-foreground">
                Create a Uniswap V3 liquidity pool for your token to enable trading
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">DAI Amount</label>
                    <div className="flex">
                        <input
                            type="number"
                            value={daiAmount}
                            onChange={(e) => setDaiAmount(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-l-md bg-background"
                            min="1"
                            step="1"
                        />
                        <div className="px-3 py-2 border border-l-0 rounded-r-md bg-muted">
                            DAI
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">ETH Amount</label>
                    <div className="flex">
                        <input
                            type="number"
                            value={ethAmount}
                            onChange={(e) => setEthAmount(e.target.value)}
                            className="flex-1 px-3 py-2 border rounded-l-md bg-background"
                            min="0.001"
                            step="0.001"
                        />
                        <div className="px-3 py-2 border border-l-0 rounded-r-md bg-muted">
                            ETH
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <Button
                    onClick={createLiquidityPool}
                    disabled={isPending || isConfirming}
                    className="w-full"
                >
                    {isPending || isConfirming ? 'Creating...' : 'Create Liquidity Pool'}
                </Button>
            </div>
        </div>
    );
}