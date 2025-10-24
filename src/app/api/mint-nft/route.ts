import { NextResponse } from 'next/server';
import { lighthouseStorage } from '@/lib/lighthouse';

export async function POST(request: Request) {
    try {
        const { imageBase64, name, description, attributes } = await request.json();

        if (!imageBase64 || !name || !description) {
            return NextResponse.json(
                { error: 'Missing required fields: imageBase64, name, description' },
                { status: 400 }
            );
        }

        // Check if Lighthouse API key is configured
        const lighthouseApiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;
        if (!lighthouseApiKey || lighthouseApiKey === 'your_lighthouse_api_key_here') {
            return NextResponse.json(
                {
                    error: 'Lighthouse API key not configured. Please set NEXT_PUBLIC_LIGHTHOUSE_API_KEY in your environment variables.',
                    details: 'Get your API key from https://lighthouse.storage/'
                },
                { status: 400 }
            );
        }

        // Always use Lighthouse upload (both development and production)
        try {
            console.log('Uploading to Lighthouse IPFS...');

            // Convert base64 to File
            const base64Data = imageBase64.split(',')[1];
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const imageFile = new File([bytes], 'nft-image.png', { type: 'image/png' });

            // Upload to Lighthouse
            const result = await lighthouseStorage.uploadNFTAssets(
                imageFile,
                name,
                description,
                attributes || []
            );

            console.log('Lighthouse upload successful:', result);

            return NextResponse.json({
                success: true,
                imageUrl: result.imageUrl,
                metadataUrl: result.metadataUrl,
                imageHash: result.imageHash,
                metadataHash: result.metadataHash,
                isDevelopment: process.env.NODE_ENV === 'development'
            });

        } catch (lighthouseError) {
            console.error('Lighthouse upload error:', lighthouseError);
            return NextResponse.json(
                {
                    error: 'Failed to upload to Lighthouse storage',
                    details: lighthouseError instanceof Error ? lighthouseError.message : 'Unknown error'
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('NFT minting error:', error);
        return NextResponse.json(
            {
                error: 'Failed to mint NFT',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
