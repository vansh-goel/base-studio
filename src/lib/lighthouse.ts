import lighthouse from '@lighthouse-web3/sdk';
// Improved ipfs accessibility


export interface LighthouseConfig {
    apiKey: string;
}

export interface UploadResult {
    hash: string;
    url: string;
}

export class LighthouseStorage {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Upload a file to Lighthouse/IPFS
     * @param file - File to upload
     * @returns Promise with upload result containing hash and URL
     */
    async uploadFile(file: File): Promise<UploadResult> {
        try {
            console.log('Starting Lighthouse upload...', { fileName: file.name, fileSize: file.size });

            // Convert File to ArrayBuffer for Lighthouse
            const arrayBuffer = await file.arrayBuffer();
            const uploadResponse = await lighthouse.uploadBuffer(arrayBuffer, this.apiKey);

            console.log('Lighthouse upload response:', uploadResponse);

            if (!uploadResponse.data || !uploadResponse.data.Hash) {
                throw new Error('Lighthouse upload failed: No hash returned');
            }

            const result = {
                hash: uploadResponse.data.Hash,
                url: `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`
            };

            console.log('Lighthouse upload successful:', result);
            return result;
        } catch (error) {
            console.error('Lighthouse upload error:', error);
            throw error;
        }
    }

    /**
     * Upload JSON metadata to Lighthouse/IPFS
     * @param metadata - JSON object to upload
     * @returns Promise with upload result containing hash and URL
     */
    async uploadMetadata(metadata: Record<string, unknown>): Promise<UploadResult> {
        try {
            const jsonString = JSON.stringify(metadata, null, 2);
            const buffer = Buffer.from(jsonString, 'utf-8');

            console.log('Starting Lighthouse metadata upload...', { metadataSize: buffer.length });

            const uploadResponse = await lighthouse.uploadBuffer(buffer, this.apiKey);

            console.log('Lighthouse metadata upload response:', uploadResponse);

            if (!uploadResponse.data || !uploadResponse.data.Hash) {
                throw new Error('Lighthouse upload failed: No hash returned');
            }

            const result = {
                hash: uploadResponse.data.Hash,
                url: `https://gateway.lighthouse.storage/ipfs/${uploadResponse.data.Hash}`
            };

            console.log('Lighthouse metadata upload successful:', result);
            return result;
        } catch (error) {
            console.error('Lighthouse metadata upload error:', error);
            throw error;
        }
    }

    /**
     * Create NFT metadata JSON following OpenSea standards
     * @param name - NFT name
     * @param description - NFT description
     * @param imageUrl - URL of the image
     * @param attributes - Additional attributes
     * @returns NFT metadata object
     */
    createNFTMetadata(
        name: string,
        description: string,
        imageUrl: string,
        attributes: Array<{ trait_type: string; value: string | number }> = []
    ) {
        return {
            name,
            description,
            image: imageUrl,
            external_url: "https://0rbit.com",
            attributes: [
                {
                    trait_type: "Created with",
                    value: "0rbit"
                },
                {
                    trait_type: "Storage",
                    value: "Lighthouse IPFS"
                },
                ...attributes
            ],
            properties: {
                files: [
                    {
                        uri: imageUrl,
                        type: "image/png"
                    }
                ],
                category: "image"
            }
        };
    }

    /**
     * Upload image and create NFT metadata
     * @param imageFile - Image file to upload
     * @param name - NFT name
     * @param description - NFT description
     * @param attributes - Additional attributes
     * @returns Promise with both image and metadata URLs
     */
    async uploadNFTAssets(
        imageFile: File,
        name: string,
        description: string,
        attributes: Array<{ trait_type: string; value: string | number }> = []
    ): Promise<{ imageUrl: string; metadataUrl: string; imageHash: string; metadataHash: string }> {
        try {
            // Upload the image first
            const imageResult = await this.uploadFile(imageFile);

            // Create metadata with the image URL
            const metadata = this.createNFTMetadata(name, description, imageResult.url, attributes);

            // Upload the metadata
            const metadataResult = await this.uploadMetadata(metadata);

            return {
                imageUrl: imageResult.url,
                metadataUrl: metadataResult.url,
                imageHash: imageResult.hash,
                metadataHash: metadataResult.hash
            };
        } catch (error) {
            console.error('Error uploading NFT assets:', error);
            throw error;
        }
    }
}

// Create a singleton instance
const lighthouseApiKey = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY || '';
export const lighthouseStorage = new LighthouseStorage(lighthouseApiKey);
