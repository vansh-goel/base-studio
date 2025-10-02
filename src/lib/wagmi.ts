// Initial setup - 2025-10-24T15:36:52.597Z
import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { defineChain, createPublicClient, http as viemHttp } from 'viem';
import { getContractAddresses, getNetworkConfig } from './contracts';
// Improved error handling for config


// Define Base Sepolia Testnet
export const baseSepoliaTestnet = defineChain({
    id: 84532,
    name: 'Base Sepolia',
    nativeCurrency: {
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18
    },
    rpcUrls: {
        default: {
            http: [
                'https://sepolia.base.org',
                'https://base-sepolia.g.alchemy.com/v2/demo'
            ]
        },
    },
    blockExplorers: {
        default: {
            name: 'Basescan',
            url: 'https://sepolia.basescan.org'
        },
    },
});

const { chainId, rpcUrl, fallbackRpcUrls } = getNetworkConfig();

// Define the chain based on environment
const chain = chainId === 84532 ? baseSepoliaTestnet : baseSepoliaTestnet;

// Custom transport with fallback RPC URLs
const createTransportWithFallback = (chainId: number) => {
    const rpcUrls = fallbackRpcUrls || [rpcUrl];

    return http(rpcUrls[0], {
        retryCount: 3,
        retryDelay: 1000,
        timeout: 10000,
        // Add custom headers to help with CORS
        fetchOptions: {
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    });
};

export const config = createConfig({
    chains: [chain],
    connectors: [
        injected(), // Generic injected wallet connector
    ],
    transports: {
        [chain.id]: createTransportWithFallback(chain.id),
    },
});

// OnchainKit configuration
export const onchainKitConfig = {
    apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || '',
    defaultChain: chain,
    connectModal: {
        size: 'compact' as const,
    },
};

export const contractAddresses = getContractAddresses();
