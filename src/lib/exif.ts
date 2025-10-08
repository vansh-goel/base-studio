// Enhanced image processing - 2025-10-24T15:36:52.961Z
import exifr from "exifr";
import { getFileExtension, isRawFileName } from "./fileFormats";
// Added metadata logging


export type ExtractedMetadata = {
    cameraMake?: string;
    cameraModel?: string;
    lensModel?: string;
    focalLength?: string;
    location?: string;
    captureDate?: string;
    exposureTime?: string;
    fNumber?: string;
    iso?: string;
    embeddedPreviewBase64?: string;
    embeddedPreviewMimeType?: string;
    raw: Record<string, unknown>;
};

type TagEntry = {
    description?: string;
    value?: unknown;
} | undefined;

type TagMap = Record<string, TagEntry>;

export async function extractMetadata(file: File): Promise<ExtractedMetadata> {
    const arrayBuffer = await file.arrayBuffer();
    const extension = getFileExtension(file.name);

    const isRaw = isRawFileName(extension);

    const options = isRaw
        ? {
            translateValues: false,
            tiff: true,
            exif: true,
            ifd1: true,
            mergeOutput: true,
        }
        : {
            translateValues: false,
            mergeOutput: true,
        };

    try {
        let tags = (await exifr.parse(arrayBuffer, options)) as TagMap | TagMap[] | null;
        if ((!tags || (Array.isArray(tags) && tags.length === 0)) && isRaw) {
            // Fallback with default options for stubborn RAW files
            tags = (await exifr.parse(arrayBuffer)) as TagMap | TagMap[] | null;
        }

        if (!tags) {
            return {
                cameraMake: undefined,
                cameraModel: undefined,
                lensModel: undefined,
                focalLength: undefined,
                location: undefined,
                captureDate: undefined,
                exposureTime: undefined,
                fNumber: undefined,
                iso: undefined,
                embeddedPreviewBase64: undefined,
                embeddedPreviewMimeType: undefined,
                raw: {},
            };
        }

        const primaryTags = Array.isArray(tags) ? tags[0] ?? {} : tags;

        const raw = mapRaw(primaryTags);

        const embeddedPreview = extractEmbeddedPreview(primaryTags);

        const captureDate =
            asString(primaryTags["DateTimeOriginal"]) ??
            asString(primaryTags["CreateDate"]) ??
            asString(primaryTags["DateTime"]) ??
            asString(primaryTags["ModifyDate"]) ??
            asString(primaryTags["DateCreated"]);

        const exposureTime =
            asString(primaryTags["ExposureTime"]) ??
            asString(primaryTags["ShutterSpeedValue"]) ??
            asString(primaryTags["ExposureTimeValue"]) ??
            asString(primaryTags["ShutterSpeed"]);

        const fNumber =
            asString(primaryTags["FNumber"]) ??
            asString(primaryTags["Aperture"]) ??
            asString(primaryTags["ApertureValue"]);

        const iso =
            asString(primaryTags["ISO"]) ??
            asString(primaryTags["ISOSpeedRatings"]) ??
            asString(primaryTags["ISOSetting"]) ??
            asString(primaryTags["ISOValue"]);

        return {
            cameraMake: asString(primaryTags["Make"]),
            cameraModel: asString(primaryTags["Model"]),
            lensModel: asString(primaryTags["LensModel"]),
            focalLength: asString(primaryTags["FocalLength"]),
            location: buildLocation(primaryTags),
            captureDate,
            exposureTime,
            fNumber,
            iso,
            embeddedPreviewBase64: embeddedPreview?.base64,
            embeddedPreviewMimeType: embeddedPreview?.mimeType,
            raw,
        };
    } catch (error) {
        console.warn("Failed to parse EXIF metadata", error);
        return {
            cameraMake: undefined,
            cameraModel: undefined,
            lensModel: undefined,
            focalLength: undefined,
            location: undefined,
            captureDate: undefined,
            exposureTime: undefined,
            fNumber: undefined,
            iso: undefined,
            embeddedPreviewBase64: undefined,
            embeddedPreviewMimeType: undefined,
            raw: {},
        };
    }
}

function buildLocation(tags: TagMap) {
    const lat = asString(tags["GPSLatitude"]);
    const lon = asString(tags["GPSLongitude"]);
    if (!lat || !lon) return undefined;
    return `${lat}, ${lon}`;
}

function mapRaw(tags: TagMap) {
    const entries = Object.entries(tags) as Array<[string, TagEntry]>;
    return entries.reduce<Record<string, unknown>>((acc, [key, value]) => {
        if (value && typeof value === "object" && "description" in value) {
            acc[key] = value.description ?? value.value;
        } else {
            acc[key] = value;
        }
        return acc;
    }, {});
}

function extractEmbeddedPreview(tags: TagMap): { base64: string; mimeType: string } | undefined {
    const thumbnail = tags["thumbnail"] ?? tags["Thumbnail"];
    if (!thumbnail) return undefined;

    const bufferLike = thumbnail as unknown;

    let arrayBuffer: ArrayBuffer | undefined;

    if (bufferLike instanceof ArrayBuffer) {
        arrayBuffer = bufferLike;
    } else if (typeof bufferLike === "object" && bufferLike !== null) {
        if ("buffer" in bufferLike && bufferLike.buffer instanceof ArrayBuffer) {
            arrayBuffer = bufferLike.buffer;
        }
    }

    if (!arrayBuffer) return undefined;

    const base64 = arrayBufferToBase64(arrayBuffer);
    const mimeTypeTag = asString(tags["thumbnailType"]) ?? asString(tags["ThumbnailType"]);
    const mimeType = normalizeMimeType(mimeTypeTag) ?? "image/jpeg";

    return { base64, mimeType };
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
}

function normalizeMimeType(input?: string) {
    if (!input) return undefined;
    const lower = input.toLowerCase();
    if (lower.includes("png")) return "image/png";
    if (lower.includes("webp")) return "image/webp";
    return "image/jpeg";
}

function asString(tag: TagEntry) {
    if (!tag) return undefined;
    if (typeof tag.description === "string") return tag.description;
    if (Array.isArray(tag.value) && tag.value.length > 0) {
        return String(tag.value[0]);
    }
    if (typeof tag.value === "string" || typeof tag.value === "number") {
        return String(tag.value);
    }
    return undefined;
}

