export type RawPreviewSource = "thumbnail" | "demosaic" | "sharp";

export type RawPreviewResult = {
    previewDataUrl: string;
    source: RawPreviewSource;
    width?: number;
    height?: number;
};

export type RawPreviewRequest = {
    fileName: string;
    originalImageBase64: string;
};


