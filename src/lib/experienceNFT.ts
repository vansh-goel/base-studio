// NFT and experience system - 2025-10-24T15:36:53.215Z
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { getContractAddresses, EXPERIENCE_NFT_ABI } from './contracts';
import { useMemo } from 'react';
// Improved error handling for experience-nft


export interface AvatarProgress {
    xp: bigint;
    levelIndex: number;
}

export interface LevelConfig {
    xpThreshold: bigint;
    metadataURI: string;
}

export const useExperienceNFT = () => {
    const { address } = useAccount();
    const { writeContract } = useWriteContract();
    const contractAddresses = getContractAddresses();

    // Debug logging
    console.log('🔍 ExperienceNFT Debug:', {
        address,
        contractAddress: contractAddresses.experienceNFT,
        hasContract: !!contractAddresses.experienceNFT,
        isLocalDev: process.env.NODE_ENV === 'development'
    });

    // Check if contract exists by trying to read a simple function
    const { data: contractName, error: nameError } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'name',
    });

    if (nameError) {
        console.error('❌ Contract not accessible:', nameError);
    } else if (contractName) {
        console.log('✅ Contract found:', contractName);
    }

    // Get user's avatar token ID
    const { data: balanceOf, error: balanceError, isPending: balancePending } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: !!address && !!contractAddresses.experienceNFT,
            retry: 1,
            retryDelay: 1000,
        }
    });

    if (balanceError) {
        console.error('❌ Balance check failed:', balanceError);
    }

    if (balancePending) {
        console.log('⏳ Checking balance...');
    } else if (balanceOf !== undefined) {
        console.log('✅ Balance result:', balanceOf.toString());
    }

    // Get token ID - we need to find which token the user owns
    // Since the contract uses a counter, we'll try to find the token by checking ownership
    const { data: tokenId, error: tokenIdError } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'ownerOf',
        args: [1n], // Try token ID 1 first
        query: {
            enabled: !!address && !!balanceOf && balanceOf > 0n,
            retry: 1,
            retryDelay: 1000,
        }
    });

    // If token ID 1 is owned by the user, use it; otherwise we need to find the correct token
    const userTokenId = tokenId && tokenId.toLowerCase() === address?.toLowerCase() ? 1n : undefined;

    console.log('🔍 Token ID logic:', {
        balanceOf: balanceOf?.toString(),
        tokenId: tokenId?.toString(),
        userTokenId: userTokenId?.toString(),
        address: address?.toLowerCase()
    });

    if (tokenIdError) {
        console.error('❌ Token ownership check failed:', tokenIdError);
    }

    // Get avatar progress
    const { data: avatarProgress } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'avatarProgress',
        args: userTokenId ? [userTokenId] : undefined,
    });

    // Get level configurations
    const { data: _levels } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'levels',
        args: [0n], // Get first level to check if contract is deployed
    });

    // Get token URI for current level
    const { data: tokenURI } = useReadContract({
        address: contractAddresses.experienceNFT as `0x${string}`,
        abi: EXPERIENCE_NFT_ABI,
        functionName: 'tokenURI',
        args: userTokenId ? [userTokenId] : undefined,
    });

    const hasAvatar = useMemo(() => {
        return balanceOf && balanceOf > 0n;
    }, [balanceOf]);

    const experience = useMemo(() => {
        if (!avatarProgress) return 0;
        return Number(avatarProgress.xp);
    }, [avatarProgress]);

    const levelIndex = useMemo(() => {
        if (!avatarProgress) return 0;
        return avatarProgress.levelIndex;
    }, [avatarProgress]);

    const experienceLevel = useMemo(() => {
        if (experience < 100) return "Apprentice";
        if (experience < 300) return "Artisan";
        if (experience < 600) return "Maestro";
        return "Visionary";
    }, [experience]);

    const mintAvatar = async () => {
        if (!address) throw new Error('No wallet connected');

        try {
            await writeContract({
                address: contractAddresses.experienceNFT as `0x${string}`,
                abi: EXPERIENCE_NFT_ABI,
                functionName: 'mint',
                args: [address],
            });
        } catch (error) {
            console.error('Failed to mint avatar:', error);
            throw error;
        }
    };

    const earnExperience = async (amount: number) => {
        if (!userTokenId) throw new Error('No avatar found');

        try {
            await writeContract({
                address: contractAddresses.experienceNFT as `0x${string}`,
                abi: EXPERIENCE_NFT_ABI,
                functionName: 'earnExperience',
                args: [userTokenId, BigInt(amount)],
            });
        } catch (error) {
            console.error('Failed to earn experience:', error);
            throw error;
        }
    };

    return {
        hasAvatar,
        experience,
        levelIndex,
        experienceLevel,
        tokenId: userTokenId,
        tokenURI,
        mintAvatar,
        earnExperience,
        isLoading: hasAvatar && !avatarProgress,
    };
};

// Level configurations based on the contract deployment
export const EXPERIENCE_LEVELS = [
    { threshold: 0, name: "Apprentice", description: "Starting your creative journey" },
    { threshold: 100, name: "Artisan", description: "Developing your craft" },
    { threshold: 300, name: "Maestro", description: "Mastering your skills" },
    { threshold: 600, name: "Visionary", description: "Leading the creative revolution" },
] as const;

export const getLevelFromExperience = (xp: number) => {
    for (let i = EXPERIENCE_LEVELS.length - 1; i >= 0; i--) {
        if (xp >= EXPERIENCE_LEVELS[i].threshold) {
            return EXPERIENCE_LEVELS[i];
        }
    }
    return EXPERIENCE_LEVELS[0];
};
