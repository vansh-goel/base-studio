import { convertRawBufferToJpeg, type RawConversionSource } from "./rawProcessing";
import sharp from "sharp";
// Added normalization logging


type NormalizeImageOptions = {
    fileName: string;
    base64: string;
};

type NormalizeImageResult = {
    base64: string;
    fileName: string;
    normalizedFormat: "jpeg" | "png" | "webp";
    normalizedMimeType: "image/jpeg" | "image/png" | "image/webp";
    originalByteLength: number;
    normalizedByteLength: number;
    rawConversionSource?: RawConversionSource;
};

const RAW_EXTENSION_REGEX = /\.(arw|cr2|cr3|nef|orf|pef|raf|rw2|sr2|dng)$/i;

export async function normalizeImageForEditing(
    payload: NormalizeImageOptions
): Promise<NormalizeImageResult> {
    const originalBuffer = Buffer.from(payload.base64, "base64");
    const originalByteLength = originalBuffer.byteLength;

    const isRaw = RAW_EXTENSION_REGEX.test(payload.fileName);

    // For non-RAW formats that OpenAI supports directly, bypass conversion
    if (!isRaw) {
        return {
            base64: payload.base64,
            fileName: payload.fileName,
            normalizedFormat: inferFormatFromFileName(payload.fileName),
            normalizedMimeType: inferMimeTypeFromFileName(payload.fileName),
            originalByteLength,
            normalizedByteLength: originalByteLength,
        };
    }

    try {
        const converted = await convertRawBufferToJpeg(originalBuffer, payload.fileName, {
            mode: "editing",
            enforceHighQuality: true,
        });

        return {
            base64: converted.base64,
            fileName: converted.fileName,
            normalizedFormat: "jpeg",
            normalizedMimeType: converted.mimeType,
            originalByteLength,
            normalizedByteLength: converted.buffer.byteLength,
            rawConversionSource: converted.source,
        };
    } catch (error) {
        console.warn("High-quality RAW conversion failed, falling back to embedded preview", error);

        try {
            const fallback = await convertRawBufferToJpeg(originalBuffer, payload.fileName, {
                mode: "preview",
            });

            return {
                base64: fallback.base64,
                fileName: fallback.fileName,
                normalizedFormat: "jpeg",
                normalizedMimeType: fallback.mimeType,
                originalByteLength,
                normalizedByteLength: fallback.buffer.byteLength,
                rawConversionSource: fallback.source,
            };
        } catch (fallbackError) {
            console.error("RAW conversion fallback also failed", fallbackError);

            // Final fallback: try to use Sharp directly on the RAW file
            try {
                console.log("Attempting final Sharp fallback for RAW file");
                const sharpBuffer = await sharp(originalBuffer)
                    .rotate()
                    .withMetadata()
                    .jpeg({ quality: 85, chromaSubsampling: "4:4:4" })
                    .toBuffer();

                return {
                    base64: sharpBuffer.toString("base64"),
                    fileName: payload.fileName.replace(/\.[^.]+$/, ".jpg"),
                    normalizedFormat: "jpeg",
                    normalizedMimeType: "image/jpeg",
                    originalByteLength,
                    normalizedByteLength: sharpBuffer.byteLength,
                    rawConversionSource: "sharp",
                };
            } catch (sharpError) {
                console.error("Final Sharp fallback also failed", sharpError);
                throw new Error(
                    "We couldn't process this RAW file automatically. Try converting it to JPEG manually and upload again."
                );
            }
        }
    }
}

function inferFormatFromFileName(fileName: string): "jpeg" | "png" | "webp" {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".png")) return "png";
    if (lower.endsWith(".webp")) return "webp";
    return "jpeg";
}

function inferMimeTypeFromFileName(fileName: string): "image/jpeg" | "image/png" | "image/webp" {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
}


