'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { contractAddresses } from '@/lib/wagmi';
import { Button } from '@/components/ui/button';
import { UNISWAP_V3_POSITION_MANAGER_ABI } from '@/lib/uniswapV3ABI';
// Added liquidity validation


interface UniswapLiquidityManagerProps {
    tokenAddress: string;
    tokenSymbol: string;
}

export function UniswapLiquidityManager({ tokenAddress, tokenSymbol }: UniswapLiquidityManagerProps) {
    const { address } = useAccount();
    const [daiAmount, setDaiAmount] = useState('100');
    const [wethAmount, setWethAmount] = useState('0.1');
    const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
    const [positions, setPositions] = useState<any[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
    const [liquidityAmount, setLiquidityAmount] = useState('100');

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Additional write contracts for position management
    const { writeContract: writeCollect, data: collectHash, isPending: isCollectPending } = useWriteContract();
    const { writeContract: writeIncrease, isPending: isIncreasePending } = useWriteContract();
    const { writeContract: writeDecrease, isPending: isDecreasePending } = useWriteContract();

    // Mock positions for now - in a real app, you'd fetch from the contract
    useEffect(() => {
        // Simulate some positions
        setPositions([
            {
                tokenId: 1,
                liquidity: '1234567890123456789',
                feesEarned: '12345678901234567890',
                token0: 'DAI',
                token1: 'WETH'
            }
        ]);
    }, []);

    const createLiquidityPosition = async () => {
        if (!address || !contractAddresses.uniswapV3Liquidity) return;

        try {
            await writeContract({
                address: contractAddresses.uniswapV3Liquidity as `0x${string}`,
                abi: [
                    {
                        "inputs": [
                            { "name": "amount0ToAdd", "type": "uint256" },
                            { "name": "amount1ToAdd", "type": "uint256" }
                        ],
                        "name": "mintNewPosition",
                        "outputs": [
                            { "name": "tokenId", "type": "uint256" },
                            { "name": "liquidity", "type": "uint128" },
                            { "name": "amount0", "type": "uint256" },
                            { "name": "amount1", "type": "uint256" }
                        ],
                        "stateMutability": "nonpayable",
                        "type": "function"
                    }
                ],
                functionName: 'mintNewPosition',
                args: [
                    BigInt(parseFloat(daiAmount) * 1e18), // DAI amount
                    BigInt(parseFloat(wethAmount) * 1e18) // WETH amount
                ],
            });
        } catch (error) {
            console.error('Error creating liquidity position:', error);
        }
    };

    // Collect fees from a position
    const handleCollectFees = async (tokenId: number) => {
        if (!address) return;

        try {
            await writeCollect({
                address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' as `0x${string}`, // Uniswap V3 Position Manager
                abi: UNISWAP_V3_POSITION_MANAGER_ABI,
                functionName: 'collect',
                args: [{
                    tokenId: BigInt(tokenId),
                    recipient: address,
                    amount0Max: BigInt('0xffffffffffffffffffffffffffffffff'), // Max uint128
                    amount1Max: BigInt('0xffffffffffffffffffffffffffffffff')  // Max uint128
                }],
            });
        } catch (error) {
            console.error('Error collecting fees:', error);
        }
    };

    // Increase liquidity in a position
    const handleIncreaseLiquidity = async (tokenId: number) => {
        if (!address || !daiAmount || !wethAmount) return;

        try {
            await writeIncrease({
                address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' as `0x${string}`,
                abi: UNISWAP_V3_POSITION_MANAGER_ABI,
                functionName: 'increaseLiquidity',
                args: [{
                    tokenId: BigInt(tokenId),
                    amount0Desired: BigInt(parseFloat(daiAmount) * 1e18),
                    amount1Desired: BigInt(parseFloat(wethAmount) * 1e18),
                    amount0Min: BigInt(0),
                    amount1Min: BigInt(0),
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 300) // 5 minutes
                }],
            });
        } catch (error) {
            console.error('Error increasing liquidity:', error);
        }
    };

    // Decrease liquidity in a position
    const handleDecreaseLiquidity = async (tokenId: number) => {
        if (!address || !liquidityAmount) return;

        try {
            await writeDecrease({
                address: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88' as `0x${string}`,
                abi: UNISWAP_V3_POSITION_MANAGER_ABI,
                functionName: 'decreaseLiquidity',
                args: [{
                    tokenId: BigInt(tokenId),
                    liquidity: BigInt(parseFloat(liquidityAmount) * 1e18),
                    amount0Min: BigInt(0),
                    amount1Min: BigInt(0),
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 300) // 5 minutes
                }],
            });
        } catch (error) {
            console.error('Error decreasing liquidity:', error);
        }
    };

    if (isSuccess) {
        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                    Liquidity position created successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                    Your liquidity position has been added to Uniswap V3.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Uniswap V3 Liquidity Management</h3>
                <div className="flex space-x-2">
                    <button
                        className={`px-3 py-1 text-sm rounded-md ${activeTab === 'create'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                            }`}
                        onClick={() => setActiveTab('create')}
                    >
                        Create Position
                    </button>
                    <button
                        className={`px-3 py-1 text-sm rounded-md ${activeTab === 'manage'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                            }`}
                        onClick={() => setActiveTab('manage')}
                    >
                        Manage Positions
                    </button>
                </div>
            </div>

            {activeTab === 'create' ? (
                <div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Add liquidity for {tokenSymbol} on Uniswap V3 to enable trading
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">DAI Amount</label>
                            <input
                                type="number"
                                value={daiAmount}
                                onChange={(e) => setDaiAmount(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">WETH Amount</label>
                            <input
                                type="number"
                                value={wethAmount}
                                onChange={(e) => setWethAmount(e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                                placeholder="0.1"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={createLiquidityPosition}
                        disabled={isPending || isConfirming || !address}
                        className="w-full"
                    >
                        {isPending || isConfirming ? 'Creating Position...' : 'Create Liquidity Position'}
                    </Button>

                    <p className="text-xs text-muted-foreground">
                        Note: You need DAI and WETH tokens to create a liquidity position.
                    </p>
                </div>
            ) : (
                <div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Manage your existing liquidity positions for {tokenSymbol}
                    </p>

                    <div className="space-y-4">
                        {positions.length > 0 ? (
                            positions.map((position) => (
                                <div key={position.tokenId} className="p-4 border rounded-lg">
                                    <h4 className="font-medium mb-2">Position #{position.tokenId}</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div>
                                            <p className="text-muted-foreground">Liquidity</p>
                                            <p className="font-medium">
                                                {(Number(position.liquidity) / 1e18).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Fees Earned</p>
                                            <p className="font-medium">
                                                {(Number(position.feesEarned) / 1e18).toFixed(4)} {position.token0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCollectFees(position.tokenId)}
                                                disabled={isCollectPending}
                                            >
                                                {isCollectPending ? 'Collecting...' : 'Collect Fees'}
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs text-muted-foreground">DAI Amount</label>
                                                <input
                                                    type="number"
                                                    value={daiAmount}
                                                    onChange={(e) => setDaiAmount(e.target.value)}
                                                    className="w-full p-1 text-xs border rounded"
                                                    placeholder="100"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground">WETH Amount</label>
                                                <input
                                                    type="number"
                                                    value={wethAmount}
                                                    onChange={(e) => setWethAmount(e.target.value)}
                                                    className="w-full p-1 text-xs border rounded"
                                                    placeholder="0.1"
                                                />
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleIncreaseLiquidity(position.tokenId)}
                                            disabled={isIncreasePending}
                                            className="w-full"
                                        >
                                            {isIncreasePending ? 'Increasing...' : 'Increase Liquidity'}
                                        </Button>

                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={liquidityAmount}
                                                onChange={(e) => setLiquidityAmount(e.target.value)}
                                                className="flex-1 p-1 text-xs border rounded"
                                                placeholder="Liquidity amount"
                                            />
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDecreaseLiquidity(position.tokenId)}
                                                disabled={isDecreasePending}
                                            >
                                                {isDecreasePending ? 'Decreasing...' : 'Decrease'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No liquidity positions found</p>
                                <p className="text-sm">Create your first position to start earning fees</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
