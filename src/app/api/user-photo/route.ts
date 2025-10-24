import { NextRequest, NextResponse } from 'next/server';
import { lighthouseStorage } from '@/lib/lighthouse';
import { promises as fs } from 'fs';
import path from 'path';

// File path for persistent storage
const STORAGE_FILE = path.join(process.cwd(), 'data', 'user-photos.json');

// Ensure data directory exists
async function ensureDataDir() {
    const dataDir = path.dirname(STORAGE_FILE);
    try {
        await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

// Load user photos from file
async function loadUserPhotos(): Promise<Record<string, Array<{ url: string, timestamp: number }>>> {
    try {
        await ensureDataDir();
        console.log('Loading from file:', STORAGE_FILE);
        const data = await fs.readFile(STORAGE_FILE, 'utf-8');
        console.log('File contents:', data);
        const parsed = JSON.parse(data);
        console.log('Parsed data:', parsed);
        return parsed;
    } catch (error) {
        console.log('No existing user photos file, starting fresh:', error);
        return {};
    }
}

// Save user photos to file
async function saveUserPhotos(userPhotos: Record<string, Array<{ url: string, timestamp: number }>>) {
    try {
        await ensureDataDir();
        console.log('Saving to file:', STORAGE_FILE);
        await fs.writeFile(STORAGE_FILE, JSON.stringify(userPhotos, null, 2));
        console.log('File saved successfully');
    } catch (error) {
        console.error('Error saving user photos:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { walletAddress, imageBase64 } = await request.json();

        console.log('Received request:', {
            walletAddress: walletAddress ? 'present' : 'missing',
            imageBase64: imageBase64 ? `present (${imageBase64.length} chars)` : 'missing',
            imageBase64Type: typeof imageBase64
        });

        if (!walletAddress || !imageBase64) {
            return NextResponse.json(
                { error: 'Wallet address and image are required' },
                { status: 400 }
            );
        }

        // Validate base64 format
        if (typeof imageBase64 !== 'string') {
            return NextResponse.json(
                { error: 'Image must be a base64 string' },
                { status: 400 }
            );
        }

        // Convert base64 to buffer for lighthouse upload
        let base64Data;
        if (imageBase64.includes(',')) {
            base64Data = imageBase64.split(',')[1];
        } else {
            base64Data = imageBase64;
        }

        console.log('Base64 data length:', base64Data.length);
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload image to IPFS using lighthouse directly
        const lighthouse = require('@lighthouse-web3/sdk');
        const apiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY;

        if (!apiKey) {
            console.error('Lighthouse API key not configured');
            // Development fallback - return a mock URL
            const mockUrl = `https://via.placeholder.com/150/000000/FFFFFF?text=${walletAddress.slice(2, 6)}`;

            // Load existing photos and add new one
            const userPhotos = await loadUserPhotos();
            console.log('Dev mode - existing photos:', userPhotos);

            const timestamp = Date.now();
            const newPhoto = {
                url: mockUrl,
                timestamp: timestamp
            };

            // Add new photo to the array (or create new array if first photo)
            const walletKey = walletAddress.toLowerCase();

            // Handle backward compatibility - check if existing data is old format
            if (!userPhotos[walletKey]) {
                userPhotos[walletKey] = [];
            } else if (typeof userPhotos[walletKey] === 'string') {
                // Convert old format to new format
                console.log('Converting old format to new format during dev upload');
                const oldUrl = userPhotos[walletKey];
                userPhotos[walletKey] = [{
                    url: oldUrl,
                    timestamp: Date.now() - 1000 // Slightly older than new photo
                }];
            }

            userPhotos[walletKey].push(newPhoto);

            console.log('Dev mode - photos after adding:', userPhotos);

            await saveUserPhotos(userPhotos);
            console.log('Dev mode - photos saved to file');

            return NextResponse.json({
                success: true,
                imageUrl: mockUrl,
                ipfsHash: 'mock-hash',
                isDevelopment: true
            });
        }

        console.log('Uploading to Lighthouse with API key:', apiKey.substring(0, 10) + '...');

        const uploadResponse = await lighthouse.uploadBuffer(buffer, apiKey);

        console.log('Lighthouse upload response:', uploadResponse);

        if (!uploadResponse.data || !uploadResponse.data.Hash) {
            console.error('Lighthouse upload failed:', uploadResponse);
            throw new Error('Lighthouse upload failed: No hash returned');
        }

        const uploadResult = {
            hash: uploadResponse.data.Hash,
            url: `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`
        };

        // Load existing photos and add new one
        const userPhotos = await loadUserPhotos();
        console.log('Existing photos before save:', userPhotos);

        const timestamp = Date.now();
        const newPhoto = {
            url: uploadResult.url,
            timestamp: timestamp
        };

        // Add new photo to the array (or create new array if first photo)
        const walletKey = walletAddress.toLowerCase();

        // Handle backward compatibility - check if existing data is old format
        if (!userPhotos[walletKey]) {
            userPhotos[walletKey] = [];
        } else if (typeof userPhotos[walletKey] === 'string') {
            // Convert old format to new format
            console.log('Converting old format to new format during upload');
            const oldUrl = userPhotos[walletKey];
            userPhotos[walletKey] = [{
                url: oldUrl,
                timestamp: Date.now() - 1000 // Slightly older than new photo
            }];
        }

        userPhotos[walletKey].push(newPhoto);

        console.log('Photos after adding new one:', userPhotos);

        await saveUserPhotos(userPhotos);
        console.log('Photos saved to file');

        console.log(`📸 User photo uploaded for ${walletAddress}:`, uploadResult.url);

        return NextResponse.json({
            success: true,
            imageUrl: uploadResult.url,
            ipfsHash: uploadResult.hash
        });

    } catch (error) {
        console.error('Error uploading user photo:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json(
            {
                error: 'Failed to upload user photo',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('walletAddress');

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            );
        }

        // Load user photos from persistent storage
        const userPhotos = await loadUserPhotos();
        console.log('Loaded user photos:', userPhotos);
        console.log('Looking for wallet:', walletAddress.toLowerCase());

        const userPhotoData = userPhotos[walletAddress.toLowerCase()];
        console.log('Found photo data:', userPhotoData);

        if (!userPhotoData) {
            console.log('No photos found for wallet:', walletAddress);
            return NextResponse.json(
                { imageUrl: null, hasPhoto: false }
            );
        }

        let latestPhoto;

        // Handle backward compatibility - check if it's old format (string) or new format (array)
        if (typeof userPhotoData === 'string') {
            // Old format - single string URL
            console.log('Converting old format to new format');
            latestPhoto = {
                url: userPhotoData,
                timestamp: Date.now() // Use current time as fallback
            };

            // Update the file to new format
            userPhotos[walletAddress.toLowerCase()] = [latestPhoto];
            await saveUserPhotos(userPhotos);
        } else if (Array.isArray(userPhotoData) && userPhotoData.length > 0) {
            // New format - array of photos
            latestPhoto = userPhotoData.reduce((latest, current) =>
                current.timestamp > latest.timestamp ? current : latest
            );
        } else {
            console.log('Invalid photo data format');
            return NextResponse.json(
                { imageUrl: null, hasPhoto: false }
            );
        }

        console.log('Latest photo:', latestPhoto);

        return NextResponse.json({
            imageUrl: latestPhoto.url,
            hasPhoto: true,
            timestamp: latestPhoto.timestamp,
            totalPhotos: Array.isArray(userPhotoData) ? userPhotoData.length : 1
        });

    } catch (error) {
        console.error('Error fetching user photo:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user photo' },
            { status: 500 }
        );
    }
}
