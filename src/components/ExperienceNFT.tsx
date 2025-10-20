// NFT and experience system - 2025-10-24T15:36:53.215Z
'use client';

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractAddresses } from '@/lib/wagmi';
import { EXPERIENCE_NFT_ABI } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
// Enhanced nft UX


export function ExperienceNFT() {
    const { address } = useAccount();
    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Read user's NFT balance
    const { data: balance } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    // For now, we'll use tokenId 1 as a placeholder
    // In a real implementation, you'd need to track user's token IDs
    const tokenId = balance && balance > 0n ? 1n : null;

    // Read avatar progress for the token
    const { data: avatarProgress } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'avatarProgress',
        args: tokenId ? [tokenId] : undefined,
    });

    const handleMintNFT = async () => {
        if (!address || !contractAddresses.experienceNFT) return;

        try {
            await writeContract({
                address: contractAddresses.experienceNFT as `0x${string}`,
                abi: EXPERIENCE_NFT_ABI,
                functionName: 'mint',
                args: [address],
            });
        } catch (error) {
            console.error('Error minting NFT:', error);
        }
    };

    const handleEarnExperience = async () => {
        if (!address || !contractAddresses.experienceNFT || !tokenId) return;

        try {
            await writeContract({
                address: contractAddresses.experienceNFT as `0x${string}`,
                abi: EXPERIENCE_NFT_ABI,
                functionName: 'earnExperience',
                args: [tokenId, 50n], // Earn 50 XP for this token
            });
        } catch (error) {
            console.error('Error earning experience:', error);
        }
    };

    const getLevelName = (levelIndex: number) => {
        const levels = ['Apprentice', 'Artisan', 'Maestro', 'Visionary'];
        return levels[levelIndex] || 'Unknown';
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
            <h3 className="text-lg font-semibold">Experience NFT</h3>

            {balance && balance > 0n ? (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        You own {balance.toString()} Experience NFT(s)
                    </p>

                    {avatarProgress && (
                        <div className="space-y-1">
                            <p className="text-sm">
                                Level: {getLevelName(Number(avatarProgress.levelIndex))}
                            </p>
                            <p className="text-sm">
                                Experience: {avatarProgress.xp.toString()} XP
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleEarnExperience}
                        disabled={isPending || isConfirming}
                        variant="outline"
                        size="sm"
                    >
                        Earn 50 XP
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                        You don't have an Experience NFT yet. Mint one to start your journey!
                    </p>

                    <Button
                        onClick={handleMintNFT}
                        disabled={isPending || isConfirming || !address}
                    >
                        {isPending || isConfirming ? 'Minting...' : 'Mint Experience NFT'}
                    </Button>
                </div>
            )}
        </div>
    );
}
