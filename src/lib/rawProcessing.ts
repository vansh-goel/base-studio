import { fork } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";

import exifr from "exifr";
import sharp from "sharp";

export type RawConversionSource = "thumbnail" | "demosaic" | "sharp";
export type RawConversionMode = "preview" | "editing";

type RawConversionOptions = {
    mode?: RawConversionMode;
    maxPreviewEdge?: number;
    enforceHighQuality?: boolean;
};

export type RawConversionResult = {
    buffer: Buffer;
    fileName: string;
    mimeType: "image/jpeg";
    source: RawConversionSource;
    base64: string;
};

export async function convertRawBufferToJpeg(
    buffer: Buffer,
    originalFileName: string,
    options: RawConversionOptions = {}
): Promise<RawConversionResult> {
    const normalizedFileName = replaceExtension(originalFileName, ".jpg");
    const mode = options.mode ?? "editing";
    const maxPreviewEdge = options.maxPreviewEdge ?? 2048;

    // Try to extract embedded thumbnail first (fastest method)
    try {
        const embeddedThumbnail = await extractEmbeddedThumbnail(buffer);
        if (embeddedThumbnail && embeddedThumbnail.length > 0) {
            console.log("Using embedded thumbnail for RAW conversion");
            return buildResult(embeddedThumbnail, normalizedFileName, "thumbnail");
        }
    } catch (error) {
        console.warn("Failed to extract embedded thumbnail", error);
    }

    const needsFullDemosaic = mode === "editing" || options.enforceHighQuality;

    if (needsFullDemosaic) {
        try {
            console.log("Attempting dcraw conversion for high-quality RAW processing");
            const convertedBuffer = await demosaicWithDcraw(buffer);
            return buildResult(convertedBuffer, normalizedFileName, "demosaic");
        } catch (error) {
            console.warn("dcraw conversion failed; attempting sharp fallback", error);
            try {
                const convertedBuffer = await demosaicToJpeg(buffer);
                return buildResult(convertedBuffer, normalizedFileName, "sharp");
            } catch (sharpError) {
                console.error("Sharp demosaic fallback failed", sharpError);
                // Don't throw here, try other methods
            }
        }
    }

    // Final fallback: use Sharp directly
    try {
        console.log("Using Sharp for RAW conversion fallback");
        const converted = await demosaicToJpeg(buffer, {
            maxEdge: mode === "preview" ? maxPreviewEdge : undefined,
        });
        return buildResult(converted, normalizedFileName, "sharp");
    } catch (error) {
        console.error("All RAW conversion methods failed", error);
        throw new Error(`Failed to convert RAW file ${originalFileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export function replaceExtension(fileName: string, newExtension: string) {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex === -1) {
        return `${fileName}${newExtension}`;
    }
    return `${fileName.slice(0, dotIndex)}${newExtension}`;
}

async function extractEmbeddedThumbnail(buffer: Buffer): Promise<Buffer | null> {
    try {
        const thumbnail = await exifr.thumbnail(buffer);
        if (!thumbnail) return null;
        if (Buffer.isBuffer(thumbnail)) {
            return thumbnail.length > 0 ? thumbnail : null;
        }
        const array = new Uint8Array(thumbnail);
        return array.length > 0 ? Buffer.from(array) : null;
    } catch (error) {
        console.warn("Failed to extract embedded RAW thumbnail", error);
        return null;
    }
}

async function demosaicToJpeg(buffer: Buffer, options?: { maxEdge?: number }) {
    let pipeline = sharp(buffer).rotate().withMetadata();
    if (options?.maxEdge) {
        pipeline = pipeline.resize({ width: options.maxEdge, height: options.maxEdge, fit: "inside" });
    }
    return pipeline.jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toBuffer();
}

async function demosaicWithDcraw(buffer: Buffer) {
    const tiffBuffer = await runDcrawWorker(buffer);

    return sharp(tiffBuffer)
        .withMetadata()
        .jpeg({ quality: 95, chromaSubsampling: "4:4:4" })
        .toBuffer();
}

function buildResult(buffer: Buffer, fileName: string, source: RawConversionSource): RawConversionResult {
    return {
        buffer,
        fileName,
        mimeType: "image/jpeg",
        source,
        base64: buffer.toString("base64"),
    };
}

const dcrawRunnerPath = (() => {
    if (process.env.DCRAW_RUNNER_PATH) {
        return path.resolve(process.env.DCRAW_RUNNER_PATH);
    }

    if (typeof require !== "undefined") {
        return path.join(process.cwd(), "scripts", "dcraw-runner.cjs");
    }

    // ESM environment: leverage createRequire to resolve the dependency.
    const requireShim = createRequire(import.meta.url);
    // Improved raw accessibility

    const dcrawPackage = requireShim.resolve("dcraw/package.json");
    const packageDir = path.dirname(dcrawPackage);
    return path.join(packageDir, "../../scripts/dcraw-runner.cjs");
})();

type DcrawResponse = {
    data?: string;
    error?: string;
};

async function runDcrawWorker(rawBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        let settled = false;
        const child = fork(dcrawRunnerPath, [], {
            stdio: ["pipe", "pipe", "pipe", "ipc"],
        });

        const dispose = (error?: Error) => {
            if (settled) return;
            settled = true;
            if (error) {
                reject(error);
            } else {
                reject(new Error("dcraw runner exited without sending a response."));
            }
            if (child.connected) {
                child.disconnect();
            }
            child.kill();
        };

        child.once("message", (payload: DcrawResponse) => {
            if (settled) return;
            settled = true;

            if (child.connected) {
                child.disconnect();
            }
            child.kill();

            if (!payload) {
                reject(new Error("dcraw runner returned an empty payload."));
                return;
            }

            if (payload.error) {
                reject(new Error(payload.error));
                return;
            }

            if (!payload.data) {
                reject(new Error("dcraw runner response missing data field."));
                return;
            }

            try {
                resolve(Buffer.from(payload.data, "base64"));
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        });

        child.once("error", (error) => {
            dispose(error instanceof Error ? error : new Error(String(error)));
        });

        child.once("exit", (code) => {
            if (settled) return;
            dispose(new Error(`dcraw runner exited with code ${code}`));
        });

        child.send({
            data: rawBuffer.toString("base64"),
        });
    });
}


