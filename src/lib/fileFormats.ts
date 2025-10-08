// Enhanced formats UX
const RASTER_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

const RAW_EXTENSIONS = [
    ".arw",
    ".cr2",
    ".cr3",
    ".nef",
    ".orf",
    ".pef",
    ".raf",
    ".rw2",
    ".sr2",
    ".dng",
] as const;

const RAW_EXTENSION_DISPLAY = RAW_EXTENSIONS.map((ext) => ext.slice(1).toUpperCase());

const SUPPORTED_EDIT_MIME_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/tiff",
    "image/x-adobe-dng",
    "image/x-sony-arw",
    "image/x-sony-sr2",
    "image/x-canon-cr2",
    "image/x-canon-cr3",
    "image/x-nikon-nef",
    "image/x-panasonic-rw2",
    "image/x-fuji-raf",
    "image/x-olympus-orf",
    "image/x-pentax-pef",
]);

const SUPPORTED_EDIT_EXTENSIONS = new Set<string>([...RASTER_EXTENSIONS, ...RAW_EXTENSIONS]);

function getFileExtension(fileName: string) {
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex === -1) return "";
    return fileName.slice(dotIndex).toLowerCase();
}

function isSupportedExtension(fileName: string) {
    return SUPPORTED_EDIT_EXTENSIONS.has(getFileExtension(fileName));
}

function isSupportedMimeType(mime?: string | null) {
    return mime ? SUPPORTED_EDIT_MIME_TYPES.has(mime.toLowerCase()) : false;
}

function isRawFileName(fileName: string) {
    return RAW_EXTENSIONS.includes(getFileExtension(fileName) as (typeof RAW_EXTENSIONS)[number]);
}

export {
    RASTER_EXTENSIONS,
    RAW_EXTENSIONS,
    RAW_EXTENSION_DISPLAY,
    SUPPORTED_EDIT_EXTENSIONS,
    SUPPORTED_EDIT_MIME_TYPES,
    getFileExtension,
    isRawFileName,
    isSupportedExtension,
    isSupportedMimeType,
};
