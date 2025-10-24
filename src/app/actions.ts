"use server";

import { openai } from "@/lib/openaiClient";
import { generateXmpSidecar, type EditOperation } from "@/lib/xmp";
import { normalizeImageForEditing } from "@/lib/imageNormalization";
import OpenAI from "openai";
// Enhanced actions UX


type ImageEditRequest = {
    fileName: string;
    originalImageBase64: string;
    instructions: string;
    metadata: Record<string, unknown>;
    persona?: string;
};

type ImageEditResponse = {
    editedImageBase64: string;
    editOperations: EditOperation[];
    xmpSidecar: string;
    normalizedInputBase64: string;
    normalizedInputMimeType: string;
    normalizedInputFileName: string;
    normalizedInputSource?: string;
};

const PLACEHOLDER_EDIT: EditOperation = {
    id: crypto.randomUUID(),
    type: "openai.edit",
    instructions: "Applied user-defined edit via OpenAI Images API",
    timestamp: new Date().toISOString(),
};

export async function runImageEdit(
    payload: ImageEditRequest
): Promise<ImageEditResponse> {
    const normalized = await normalizeImageForEditing({
        fileName: payload.fileName,
        base64: payload.originalImageBase64,
    });

    const imageBuffer = Buffer.from(normalized.base64, "base64");

    const imageUpload = await OpenAI.toFile(imageBuffer, normalized.fileName, {
        type: normalized.normalizedMimeType,
    });

    const personaHint = payload.persona ? `Persona: ${payload.persona}` : "";
    const metadataHint = Object.keys(payload.metadata).length
        ? `Metadata: ${JSON.stringify(payload.metadata)}`
        : "";
    const compositePrompt = [payload.instructions, personaHint, metadataHint]
        .filter(Boolean)
        .join("\n\n");

    const result = await openai.images.edit({
        model: "gpt-image-1",
        image: imageUpload,
        prompt: compositePrompt,
        size: "1024x1024",
    });

    if (!result.data?.[0]?.b64_json) {
        throw new Error("OpenAI did not return an edited image.");
    }

    const editedImageBase64 = result.data[0].b64_json;
    const edits: EditOperation[] = [
        {
            ...PLACEHOLDER_EDIT,
            instructions: payload.instructions,
            parameters: {
                originalFileSize: normalized.originalByteLength,
                normalizedFileSize: normalized.normalizedByteLength,
                normalizedFormat: normalized.normalizedFormat,
                normalizedMimeType: normalized.normalizedMimeType,
                metadataExtracted: Object.keys(payload.metadata),
                persona: payload.persona,
                rawConversionSource: normalized.rawConversionSource,
            },
        },
    ];

    const xmpSidecar = generateXmpSidecar(edits, payload.persona);

    return {
        editedImageBase64,
        editOperations: edits,
        xmpSidecar,
        normalizedInputBase64: normalized.base64,
        normalizedInputMimeType: normalized.normalizedMimeType,
        normalizedInputFileName: normalized.fileName,
        normalizedInputSource: normalized.rawConversionSource,
    };
}

