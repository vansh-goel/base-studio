// Final improvements and bug fixes - 2025-10-24T15:36:53.370Z
// AI integration and token system - 2025-10-24T15:36:53.090Z
import { readContract } from '@wagmi/core';
import { contractAddresses, config } from './wagmi';
import { MEME_TOKEN_FACTORY_ABI, EXPERIENCE_NFT_ABI } from './contracts';
import { INDIVIDUAL_TOKEN_ABI } from './individualTokenABI';
// Added tokens validation


export interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    description: string;
    image: string;
    twitter: string;
    telegram: string;
    website: string;
    developer: string;
    totalSupply?: string;
    balance: string;
    isCreator: boolean;
}

export interface NFTInfo {
    tokenId: number;
    level: string;
    experience: number;
    image: string;
    metadata?: Record<string, unknown>;
}

/**
 * Fetch metadata for a single token contract
 */
export async function fetchTokenMetadata(tokenAddress: string): Promise<TokenInfo | null> {
    try {
        console.log(`🔍 Fetching metadata for token: ${tokenAddress}`);
        const [name, symbol, description, image, twitter, telegram, website, developer, totalSupply] = await Promise.all([
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "name",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "symbol",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "description",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "image",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "twitter",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "telegram",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "website",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "developer",
            }),
            readContract(config, {
                address: tokenAddress as `0x${string}`,
                abi: INDIVIDUAL_TOKEN_ABI,
                functionName: "totalSupply",
            }),
        ]);

        const tokenInfo = {
            address: tokenAddress,
            name: name as string,
            symbol: symbol as string,
            description: description as string,
            image: image as string,
            twitter: twitter as string,
            telegram: telegram as string,
            website: website as string,
            developer: developer as string,
            totalSupply: totalSupply ? totalSupply.toString() : undefined,
            balance: '0', // Will be set when fetching user tokens
            isCreator: false, // Will be set when fetching user tokens
        };

        console.log(`✅ Fetched metadata for ${tokenInfo.name}:`, {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            image: tokenInfo.image,
            description: tokenInfo.description
        });

        return tokenInfo;
    } catch (error) {
        console.error(`Error fetching token metadata for ${tokenAddress}:`, error);
        return null;
    }
}

/**
 * Fetch user's balance for a specific token
 */
export async function fetchUserTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    try {
        const balance = await readContract(config, {
            address: tokenAddress as `0x${string}`,
            abi: INDIVIDUAL_TOKEN_ABI,
            functionName: "balanceOf",
            args: [userAddress as `0x${string}`],
        });
        return balance ? balance.toString() : '0';
    } catch (error) {
        console.error(`Error fetching balance for token ${tokenAddress}:`, error);
        return '0';
    }
}

/**
 * Fetch all deployed tokens with their real metadata
 */
export async function fetchAllTokens(): Promise<TokenInfo[]> {
    try {
        console.log('🔍 Fetching all tokens...');
        console.log('Factory address:', contractAddresses.memeTokenFactory);
        console.log('Environment variables:', {
            MEME_TOKEN_FACTORY: process.env.NEXT_PUBLIC_MEME_TOKEN_FACTORY_ADDRESS,
            EXPERIENCE_NFT: process.env.NEXT_PUBLIC_EXPERIENCE_NFT_ADDRESS,
            UNISWAP_V3: process.env.NEXT_PUBLIC_UNISWAP_V3_LIQUIDITY_ADDRESS
        });

        // Check if factory address is set
        if (!contractAddresses.memeTokenFactory || contractAddresses.memeTokenFactory === '0x0000000000000000000000000000000000000000') {
            console.log('❌ Factory contract address not set. Please set NEXT_PUBLIC_MEME_TOKEN_FACTORY_ADDRESS');
            return [];
        }

        console.log('📡 Calling getDeployedTokens on factory...');
        // Get deployed token addresses from factory
        const deployedTokens = await readContract(config, {
            address: contractAddresses.memeTokenFactory as `0x${string}`,
            abi: MEME_TOKEN_FACTORY_ABI,
            functionName: "getDeployedTokens",
        });

        console.log('📋 Deployed tokens result:', deployedTokens);

        if (!Array.isArray(deployedTokens) || deployedTokens.length === 0) {
            console.log('❌ No deployed tokens found or contract not accessible');
            return [];
        }

        console.log(`✅ Found ${deployedTokens.length} deployed tokens`);

        // Fetch metadata for each token
        const tokenPromises = deployedTokens.map((tokenAddress: string) =>
            fetchTokenMetadata(tokenAddress)
        );

        const tokens = await Promise.all(tokenPromises);
        return tokens.filter((token): token is TokenInfo => token !== null);
    } catch (error) {
        console.error('Error fetching all tokens:', error);
        console.log('This might be because the factory contract is not deployed or accessible');
        return [];
    }
}

/**
 * Fetch user's tokens with real balances and creator status
 */
export async function fetchUserTokens(userAddress: string): Promise<TokenInfo[]> {
    try {
        const allTokens = await fetchAllTokens();

        // Fetch user balances and determine creator status for each token
        const userTokens = await Promise.all(
            allTokens.map(async (token) => {
                const balance = await fetchUserTokenBalance(token.address, userAddress);
                const isCreator = token.developer.toLowerCase() === userAddress.toLowerCase();
                const hasBalance = Number(balance) > 0;

                return {
                    ...token,
                    balance: balance || '0',
                    isCreator,
                    // Only include tokens the user created or has a balance of
                    shouldInclude: isCreator || hasBalance,
                };
            })
        );

        return userTokens
            .filter(token => token !== null && token.shouldInclude)
            .map(({ shouldInclude: _, ...token }) => token as TokenInfo);
    } catch (error) {
        console.error('Error fetching user tokens:', error);
        return [];
    }
}

/**
 * Fetch NFT metadata from Lighthouse IPFS
 */
export async function fetchNFTMetadata(metadataUrl: string): Promise<Record<string, unknown> | null> {
    try {
        const response = await fetch(metadataUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch metadata: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        console.log('📄 NFT Metadata Content-Type:', contentType);

        // Handle SVG responses - these are likely avatar images, not metadata
        if (contentType && contentType.includes('image/svg+xml')) {
            console.warn('⚠️ Response is SVG, not JSON metadata');
            return null;
        }

        // Handle other image types
        if (contentType && contentType.includes('image/')) {
            console.warn('⚠️ Response is image, not JSON metadata');
            return null;
        }

        // Only try to parse as JSON if it's actually JSON
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }

        // If content type is unknown, check the content
        const text = await response.text();
        console.log('📝 Raw response preview:', text.substring(0, 200) + '...');

        // Check if it looks like JSON
        if (text.trim().startsWith('{') && text.trim().endsWith('}')) {
            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('❌ Failed to parse JSON:', parseError);
                return null;
            }
        }

        // If it's not JSON, return null
        console.warn('⚠️ Response is not JSON metadata');
        return null;
    } catch (error) {
        console.error('Error fetching NFT metadata:', error);
        return null;
    }
}

/**
 * Fetch user's NFTs with their real metadata from Lighthouse
 */
export async function fetchUserNFTs(userAddress: string, nftBalance: number): Promise<NFTInfo[]> {
    try {
        const nfts: NFTInfo[] = [];

        for (let i = 0; i < nftBalance; i++) {
            try {
                // Get token URI from NFT contract
                const tokenURI = await readContract(config, {
                    address: contractAddresses.experienceNFT as `0x${string}`,
                    abi: EXPERIENCE_NFT_ABI,
                    functionName: "tokenURI",
                    args: [BigInt(i + 1)],
                });

                // Fetch metadata from Lighthouse
                const metadata = await fetchNFTMetadata(tokenURI as string);

                if (metadata) {
                    nfts.push({
                        tokenId: i + 1,
                        level: (metadata.attributes as any[])?.find((attr: { trait_type: string; value: string | number }) => attr.trait_type === "Level")?.value || "Unknown",
                        experience: (metadata.attributes as any[])?.find((attr: { trait_type: string; value: string | number }) => attr.trait_type === "Experience")?.value || 0,
                        image: (metadata as any).image || `/nft-${(i + 1) % 4 + 1}.svg`,
                        metadata,
                    });
                } else {
                    // Fallback to placeholder if metadata fetch fails
                    nfts.push({
                        tokenId: i + 1,
                        level: "Unknown",
                        experience: 0,
                        image: `/nft-${(i + 1) % 4 + 1}.svg`,
                    });
                }
            } catch (error) {
                console.error(`Error fetching NFT ${i + 1}:`, error);
                // Add placeholder NFT if metadata fetch fails
                nfts.push({
                    tokenId: i + 1,
                    level: "Unknown",
                    experience: 0,
                    image: `/nft-${(i + 1) % 4 + 1}.svg`,
                });
            }
        }

        return nfts;
    } catch (error) {
        console.error('Error fetching user NFTs:', error);
        return [];
    }
}
