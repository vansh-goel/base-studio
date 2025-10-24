// AI integration and token system - 2025-10-24T15:36:53.090Z
'use client';

import { useState } from 'react';
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

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const generateMetadata = async () => {
        if (!imageUrl) return;

        setIsGenerating(true);

        try {
            // Extract base64 data from the imageUrl
            const base64Data = imageUrl.split(',')[1];

            console.log('Generating metadata for image...');

            // First, test IPFS upload to see if it's working
            console.log('Testing IPFS upload...');
            try {
                const uploadResponse = await fetch('/api/mint-nft', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        imageBase64: imageUrl,
                        name: 'Test Upload',
                        description: 'Testing IPFS upload during metadata generation',
                        attributes: [
                            { trait_type: "Test", value: "Metadata Generation" }
                        ]
                    }),
                });

                if (uploadResponse.ok) {
                    const uploadResult = await uploadResponse.json();
                    console.log('✅ IPFS upload successful during metadata generation:', uploadResult);
                    console.log('Image URL from IPFS:', uploadResult.imageUrl);
                } else {
                    const errorData = await uploadResponse.json();
                    console.error('❌ IPFS upload failed during metadata generation:', errorData);
                }
            } catch (uploadError) {
                console.error('❌ IPFS upload error during metadata generation:', uploadError);
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
                description: "This token represents a unique AI-enhanced image created in 0rbit.",
                twitter: "https://twitter.com/aimemetoken",
                telegram: "https://t.me/aimemetoken",
                website: "https://aimeme.example.com"
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
            setStatusMessage("Creating token on blockchain...");

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

            await writeContract({
                address: contractAddresses.memeTokenFactory as `0x${string}`,
                abi: MEME_TOKEN_FACTORY_ABI,
                functionName: 'createToken',
                args: contractArgs,
            });

            setStatusMessage("Token created successfully!");
        } catch (error) {
            console.error('Error creating token:', error);
            setStatusMessage("Failed to create token. Please try again.");
        }
    };

    const handleInputChange = (field: keyof TokenMetadata, value: string) => {
        if (!metadata) return;
        setMetadata({
            ...metadata,
            [field]: value
        });
    };

    if (isSuccess && hash) {
        // Call the onTokenCreated callback with the token address
        // In a real implementation, you would get the token address from the transaction receipt
        const simulatedTokenAddress = `0x${hash.slice(2, 42)}`;

        return (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium mb-2">
                    Token created successfully!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                    Your meme token has been deployed to the blockchain.
                </p>
                <div className="flex gap-2">
                    <Button size="sm" onClick={() => onTokenCreated?.(simulatedTokenAddress)}>
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
                            {isPending || isConfirming ? 'Creating...' : 'Create Token'}
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(true)} className="flex-1">
                            Edit Metadata
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}