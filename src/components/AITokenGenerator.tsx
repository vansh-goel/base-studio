// AI integration and token system - 2025-10-24T15:36:53.090Z
'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractAddresses } from '@/lib/wagmi';
import { MEME_TOKEN_FACTORY_ABI } from '@/lib/contracts';
import { Button } from '@/components/ui/button';
// Added token-gen validation


interface AITokenGeneratorProps {
    imageUrl: string;
    onTokenCreated?: (tokenAddress: string) => void;
}

type TokenMetadata = {
    name: string;
    symbol: string;
    description: string;
    twitter: string;
    telegram: string;
    website: string;
};

export function AITokenGenerator({ imageUrl, onTokenCreated }: AITokenGeneratorProps) {
    const { address } = useAccount();
    const [isGenerating, setIsGenerating] = useState(false);
    const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    // Detect mobile device
    useEffect(() => {
        const checkMobile = () => {
            const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            setIsMobile(isMobileDevice);
        };

        checkMobile();
    }, []);

    const generateMetadata = async () => {
        if (!imageUrl) return;

        setIsGenerating(true);
        setStatusMessage("Generating AI metadata...");

        try {
            // Extract base64 data from the imageUrl
            const base64Data = imageUrl.split(',')[1];

            console.log('Generating metadata for image...');

            // Upload image to IPFS first for faster token creation later
            console.log('Uploading image to IPFS...');
            setStatusMessage("Uploading image to IPFS...");

            const uploadResponse = await fetch('/api/mint-nft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageBase64: imageUrl,
                    name: 'Metadata Generation',
                    description: 'Uploading image during metadata generation for faster token creation',
                    attributes: [
                        { trait_type: "Stage", value: "Metadata Generation" }
                    ]
                }),
            });

            let imageUrlFromIPFS = imageUrl; // fallback to original imageUrl

            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                console.log('✅ IPFS upload successful:', uploadResult);
                imageUrlFromIPFS = uploadResult.imageUrl;
                setStatusMessage("Image uploaded to IPFS! Generating metadata...");
            } else {
                const errorData = await uploadResponse.json();
                console.error('❌ IPFS upload failed:', errorData);
                setStatusMessage("IPFS upload failed, using local image. Generating metadata...");
            }

            // Call OpenAI API to analyze the image and generate token metadata
            const response = await fetch('/api/generate-token-metadata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ image: base64Data }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error(`Failed to generate metadata: ${response.status}`);
            }

            const generatedMetadata = await response.json();
            console.log('Generated metadata:', generatedMetadata);
            setMetadata(generatedMetadata);
        } catch (error) {
            console.error('Error generating metadata:', error);
            // Fallback to default metadata if API call fails
            const fallbackMetadata: TokenMetadata = {
                name: "AI Generated Meme Token",
                symbol: "AIMEME",
                description: "This token represents a unique AI-enhanced image created in Base Studio.",
                twitter: "https://twitter.com/basestudio",
                telegram: "https://t.me/basestudio",
                website: "https://basestudio.app"
            };
            setMetadata(fallbackMetadata);
        } finally {
            setIsGenerating(false);
        }
    };

    const createToken = async () => {
        if (!address || !metadata || !contractAddresses.memeTokenFactory) {
            console.error('Missing required data:', { address, metadata, contractAddress: contractAddresses.memeTokenFactory });
            return;
        }

        try {
            console.log('Creating token with metadata:', metadata);
            console.log('Contract address:', contractAddresses.memeTokenFactory);

            // Upload the actual edited image to IPFS via Lighthouse
            setStatusMessage("Uploading your edited image to IPFS...");

            const imageResponse = await fetch('/api/mint-nft', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageBase64: imageUrl,
                    name: metadata.name,
                    description: metadata.description,
                    attributes: [
                        { trait_type: "Token Symbol", value: metadata.symbol },
                        { trait_type: "Created By", value: "Base Studio" }
                    ]
                }),
            });

            let finalImageUrl;

            if (!imageResponse.ok) {
                const errorData = await imageResponse.json();
                console.error('IPFS upload failed:', errorData);
                throw new Error(`IPFS upload failed: ${errorData.error || 'Unknown error'}`);
            } else {
                const imageResult = await imageResponse.json();
                console.log('Image uploaded to IPFS:', imageResult);
                finalImageUrl = imageResult.imageUrl;
                setStatusMessage("Image uploaded successfully to IPFS!");
            }

            console.log('Final image URL:', finalImageUrl);

            // Now create the token with the real IPFS image URL
            setStatusMessage("Preparing blockchain transaction...");

            const contractArgs = [
                metadata.name,
                metadata.symbol,
                metadata.description,
                finalImageUrl, // Use the IPFS URL or fallback placeholder
                metadata.twitter,
                metadata.telegram,
                metadata.website
            ];

            console.log('Contract arguments:', contractArgs);
            console.log('Image URL being passed to contract:', finalImageUrl);

            if (isMobile) {
                setStatusMessage("Please open your mobile wallet app and sign the transaction...");
            } else {
                setStatusMessage("Please sign the transaction in your wallet...");
            }

            // For mobile WalletConnect, ensure the transaction properly triggers the modal
            if (isMobile) {
                // Mobile-specific: Ensure WalletConnect session request is triggered
                setStatusMessage("Triggering mobile wallet connection for transaction...");

                // Small delay to ensure mobile wallet app is ready
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const writeContractPromise = writeContract({
                address: contractAddresses.memeTokenFactory as `0x${string}`,
                abi: MEME_TOKEN_FACTORY_ABI,
                functionName: 'createToken',
                args: contractArgs,
            });

            await writeContractPromise;

            setStatusMessage("Transaction submitted! Waiting for confirmation...");
        } catch (error) {
            console.error('Error creating token:', error);

            // Better error messages for different types of failures
            if (error instanceof Error) {
                if (error.message.includes('User rejected') || error.message.includes('UserRejectedRequestError')) {
                    setStatusMessage("Transaction cancelled by user. Please try again.");
                } else if (error.message.includes('insufficient funds')) {
                    setStatusMessage("Insufficient funds for transaction. Please add ETH to your wallet.");
                } else if (error.message.includes('network')) {
                    setStatusMessage("Network error. Please check your connection and try again.");
                } else {
                    setStatusMessage(`Failed to create token: ${error.message}`);
                }
            } else {
                setStatusMessage("Failed to create token. Please try again.");
            }
        }
    };

    const handleInputChange = (field: keyof TokenMetadata, value: string) => {
        if (!metadata) return;
        setMetadata({
            ...metadata,
            [field]: value
        });
    };

    // Show transaction status
    if (hash && !isSuccess) {
        return (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-800 dark:text-blue-200 font-medium mb-2">
                    {isConfirming ? 'Confirming Transaction...' : 'Transaction Submitted'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                    {isConfirming
                        ? (isMobile
                            ? 'Please wait while your transaction is being confirmed on the blockchain. You can check your wallet app for updates.'
                            : 'Please wait while your transaction is being confirmed on the blockchain.'
                        )
                        : (isMobile
                            ? 'Your transaction has been submitted. Please check your mobile wallet app for confirmation status.'
                            : 'Your transaction has been submitted. Waiting for confirmation...'
                        )
                    }
                </p>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(`https://sepolia.basescan.org/tx/${hash}`, '_blank')}>
                        View Transaction
                    </Button>
                </div>
            </div>
        );
    }

    if (isSuccess && hash) {
        // Call the onTokenCreated callback with the token address
        // In a real implementation, you would get the token address from the transaction receipt
        const simulatedTokenAddress = `0x${hash.slice(2, 42)}`;

        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                    ✅ Token Created Successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    Your meme token has been deployed to the blockchain and is now live.
                </p>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => {
                        onTokenCreated?.(simulatedTokenAddress);
                        // Navigate to trade page to view the token
                        window.location.href = '/trade';
                    }}>
                        View Token
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
            <h3 className="text-lg font-semibold">Create Meme Token</h3>

            {!metadata ? (
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Generate token metadata based on your image using AI
                    </p>
                    <Button
                        onClick={generateMetadata}
                        disabled={isGenerating || !imageUrl}
                        className="w-full"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Token Metadata'}
                    </Button>
                </div>
            ) : isEditing ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Token Name</label>
                            <input
                                type="text"
                                value={metadata.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Token Symbol</label>
                            <input
                                type="text"
                                value={metadata.symbol}
                                onChange={(e) => handleInputChange('symbol', e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            value={metadata.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            className="w-full p-2 border rounded-md bg-background"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Twitter</label>
                            <input
                                type="text"
                                value={metadata.twitter}
                                onChange={(e) => handleInputChange('twitter', e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Telegram</label>
                            <input
                                type="text"
                                value={metadata.telegram}
                                onChange={(e) => handleInputChange('telegram', e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Website</label>
                            <input
                                type="text"
                                value={metadata.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                className="w-full p-2 border rounded-md bg-background"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={() => setIsEditing(false)} className="flex-1">
                            Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setMetadata(null)} className="flex-1">
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Name</p>
                            <p className="font-medium">{metadata.name}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Symbol</p>
                            <p className="font-medium">{metadata.symbol}</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="text-sm">{metadata.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Twitter</p>
                            <p className="text-sm truncate">{metadata.twitter}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Telegram</p>
                            <p className="text-sm truncate">{metadata.telegram}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Website</p>
                            <p className="text-sm truncate">{metadata.website}</p>
                        </div>
                    </div>

                    {statusMessage && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-800 dark:text-blue-200">{statusMessage}</p>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={createToken}
                            disabled={isPending || isConfirming}
                            className="flex-1"
                        >
                            {isPending ? 'Preparing Transaction...' : isConfirming ? 'Confirming...' : 'Create Token'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditing(true)}
                            className="flex-1"
                            disabled={isPending || isConfirming}
                        >
                            Edit Metadata
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}