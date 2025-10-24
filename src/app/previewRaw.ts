"use server";

import { convertRawBufferToJpeg } from "@/lib/rawProcessing";
import { type RawPreviewResult } from "@/types/raw";

type PreviewRawPayload = {
    fileName: string;
    base64: string;
};

export async function generateRawPreviewOnServer(
    payload: PreviewRawPayload
): Promise<RawPreviewResult | null> {
    try {
        const buffer = Buffer.from(payload.base64, "base64");

        const converted = await convertRawBufferToJpeg(buffer, payload.fileName, {
            mode: "preview",
            maxPreviewEdge: 1600,
        });

        return {
            previewDataUrl: `data:${converted.mimeType};base64,${converted.base64}`,
            source: converted.source,
        };
    } catch (error) {
        console.warn("Server RAW preview generation failed", error);
        return null;
    }
}


