"use client";

import { useExperienceNFT, EXPERIENCE_LEVELS, getLevelFromExperience } from '@/lib/experienceNFT';
import { useAccount } from 'wagmi';
import { useState, useEffect } from 'react';
// Added avatar logging


interface ExperienceAvatarProps {
    onExperienceEarned?: (amount: number) => void;
}

export function ExperienceAvatar({ onExperienceEarned }: ExperienceAvatarProps) {
    const { address, isConnected } = useAccount();
    const {
        hasAvatar,
        experience,
        levelIndex,
        experienceLevel,
        tokenId,
        tokenURI,
        mintAvatar,
        earnExperience,
        isLoading
    } = useExperienceNFT();

    const [isMinting, setIsMinting] = useState(false);
    const [isEarning, setIsEarning] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [nftImage, setNftImage] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);

    // Debug logging
    console.log('🎭 ExperienceAvatar Debug:', {
        isConnected,
        hasAvatar,
        experience,
        levelIndex,
        experienceLevel,
        tokenId: tokenId?.toString(),
        tokenURI,
        nftImage,
        isLoading
    });

    // Fetch NFT image from metadata
    useEffect(() => {
        const fetchNftImage = async () => {
            if (!tokenURI) return;

            setImageLoading(true);
            try {
                console.log('🔍 Fetching NFT metadata from:', tokenURI);
                const response = await fetch(tokenURI);

                if (!response.ok) {
                    console.error('❌ Failed to fetch metadata:', response.status, response.statusText);
                    return;
                }

                const contentType = response.headers.get('content-type');
                console.log('📄 Content-Type:', contentType);

                // Handle SVG responses directly
                if (contentType && contentType.includes('image/svg+xml')) {
                    console.log('🖼️ Response is SVG, using tokenURI directly');
                    setNftImage(tokenURI);
                    return;
                }

                // Handle other image types
                if (contentType && contentType.includes('image/')) {
                    console.log('🖼️ Response is image, using tokenURI directly');
                    setNftImage(tokenURI);
                    return;
                }

                // If it's not JSON, check for direct image URLs
                if (!contentType || !contentType.includes('application/json')) {
                    console.warn('⚠️ Response is not JSON, content-type:', contentType);
                    // If it's HTML or other content, maybe the tokenURI is actually an image
                    if (tokenURI.includes('.jpg') || tokenURI.includes('.png') || tokenURI.includes('.gif') || tokenURI.includes('.webp') || tokenURI.includes('.svg')) {
                        console.log('🖼️ TokenURI appears to be a direct image URL');
                        setNftImage(tokenURI);
                        return;
                    }
                    return;
                }

                const text = await response.text();
                console.log('📝 Raw response:', text.substring(0, 200) + '...');

                // Check if the response is actually JSON
                if (text.trim().startsWith('<') || text.includes('<svg')) {
                    console.warn('⚠️ Response appears to be SVG/HTML, not JSON');
                    return;
                }

                let metadata;
                try {
                    metadata = JSON.parse(text);
                    console.log('📋 Parsed metadata:', metadata);
                } catch (parseError) {
                    console.error('❌ Failed to parse JSON:', parseError);
                    console.log('📝 Raw text that failed to parse:', text.substring(0, 500));
                    return;
                }

                if (metadata.image) {
                    setNftImage(metadata.image);
                }
            } catch (error) {
                console.error('❌ Failed to fetch NFT metadata:', error);
                console.log('🔍 TokenURI was:', tokenURI);

                // Fallback: try using tokenURI directly as image
                if (tokenURI && (tokenURI.includes('http') || tokenURI.includes('ipfs'))) {
                    console.log('🔄 Trying tokenURI as direct image URL');
                    setNftImage(tokenURI);
                }
            } finally {
                setImageLoading(false);
            }
        };

        fetchNftImage();
    }, [tokenURI]);

    const currentLevel = getLevelFromExperience(experience);
    const nextLevel = EXPERIENCE_LEVELS[levelIndex + 1];
    const progressToNext = nextLevel ?
        Math.min(100, ((experience - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100) : 100;

    const handleMintAvatar = async () => {
        if (!isConnected) {
            setStatusMessage('Please connect your wallet first');
            return;
        }

        setIsMinting(true);
        setStatusMessage('Minting avatar...');
        try {
            await mintAvatar();
            setStatusMessage('Avatar minted successfully! You can now start earning experience.');
        } catch (error) {
            console.error('Failed to mint avatar:', error);
            setStatusMessage('Failed to mint avatar. Please try again.');
        } finally {
            setIsMinting(false);
        }
    };

    const handleEarnExperience = async (amount: number) => {
        if (!hasAvatar) {
            setStatusMessage('Please mint an avatar first');
            return;
        }

        setIsEarning(true);
        setStatusMessage(`Earning ${amount} XP...`);
        try {
            await earnExperience(amount);
            onExperienceEarned?.(amount);
            setStatusMessage(`Earned ${amount} XP! Your avatar is evolving...`);
        } catch (error) {
            console.error('Failed to earn experience:', error);
            setStatusMessage('Failed to earn experience. Please try again.');
        } finally {
            setIsEarning(false);
        }
    };

    if (!isConnected) {
        return (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="text-lg font-semibold mb-4">Connect Wallet</h3>
                <p className="text-muted-foreground">
                    Connect your wallet to start your creative journey and mint your soulbound avatar.
                </p>
            </div>
        );
    }

    if (!hasAvatar) {
        return (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <h3 className="text-lg font-semibold mb-4">Mint Your Avatar</h3>
                <p className="text-muted-foreground mb-4">
                    Mint your soulbound avatar to start earning experience points and evolve your creative journey.
                </p>
                <button
                    onClick={handleMintAvatar}
                    disabled={isMinting}
                    className="rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
                >
                    {isMinting ? 'Minting...' : 'Mint Avatar'}
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
                <div className="animate-pulse">
                    <div className="h-4 bg-[var(--muted)] rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-[var(--muted)] rounded w-3/4"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Loading avatar data...
                    <br />
                    <span className="text-red-500">If this persists, check contract address and network</span>
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-blue-500 hover:underline"
                >
                    Refresh to retry
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border)]">
                        {nftImage ? (
                            <img
                                src={nftImage}
                                alt="NFT Avatar"
                                className="w-full h-full object-cover"
                                onError={() => setNftImage(null)}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                {experienceLevel.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Your Avatar</h3>
                        <span className="text-sm text-muted-foreground">Token #{tokenId?.toString()}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Current Level */}
                <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--foreground)]">{currentLevel.name}</div>
                    <div className="text-sm text-muted-foreground">{currentLevel.description}</div>
                </div>

                {/* Experience Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Experience</span>
                        <span className="font-semibold">{experience} XP</span>
                    </div>

                    {nextLevel && (
                        <>
                            <div className="w-full bg-[var(--muted)] rounded-full h-2">
                                <div
                                    className="bg-[var(--foreground)] h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progressToNext}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{currentLevel.threshold} XP</span>
                                <span>{nextLevel.threshold} XP</span>
                            </div>
                        </>
                    )}
                </div>

                {/* NFT Metadata */}
                {tokenURI && (
                    <div className="text-center">
                        <a
                            href={tokenURI}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline"
                        >
                            View NFT Metadata
                        </a>
                    </div>
                )}

                {/* Testing button for development */}
                <div className="flex gap-2">
                    <button
                        onClick={() => handleEarnExperience(100)}
                        disabled={isEarning}
                        className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)] disabled:opacity-50"
                    >
                        {isEarning ? 'Earning...' : '+100 XP (Test)'}
                    </button>
                </div>

                {/* Status Message */}
                {statusMessage && (
                    <div className="mt-3 p-3 rounded-lg bg-[var(--muted)] text-sm text-[var(--foreground)]">
                        {statusMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
