// Enhanced image processing - 2025-10-24T15:36:52.961Z
"use client";

import { useState, useRef, useEffect } from 'react';
// Improved editor accessibility


interface ImageEditorProps {
    imageSrc: string;
    onImageChange: (editedImageSrc: string) => void;
    onClose: () => void;
}

interface ImageAdjustments {
    brightness: number;
    contrast: number;
    saturation: number;
    hue: number;
    exposure: number;
    gamma: number;
    blur: number;
    sharpen: number;
}

export function ImageEditor({ imageSrc, onImageChange, onClose }: ImageEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageRef = useRef<HTMLImageElement | null>(null);
    const [adjustments, setAdjustments] = useState<ImageAdjustments>({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        hue: 0,
        exposure: 0,
        gamma: 1,
        blur: 0,
        sharpen: 0,
    });

    const [isProcessing, setIsProcessing] = useState(false);

    // Load original image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            originalImageRef.current = img;
            applyAdjustments();
        };
        img.src = imageSrc;
    }, [imageSrc]);

    const applyAdjustments = () => {
        if (!originalImageRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = originalImageRef.current;

        // Calculate display size (max 1000px width, maintain aspect ratio)
        const maxWidth = 1000;
        const maxHeight = 800;
        let displayWidth = img.width;
        let displayHeight = img.height;

        if (displayWidth > maxWidth) {
            displayHeight = (displayHeight * maxWidth) / displayWidth;
            displayWidth = maxWidth;
        }

        if (displayHeight > maxHeight) {
            displayWidth = (displayWidth * maxHeight) / displayHeight;
            displayHeight = maxHeight;
        }

        // Set canvas size for display
        canvas.width = displayWidth;
        canvas.height = displayHeight;

        console.log('Canvas sizing:', {
            original: { width: img.width, height: img.height },
            display: { width: displayWidth, height: displayHeight },
            maxSize: { width: maxWidth, height: maxHeight }
        });

        // Apply CSS filters
        const filters = [
            `brightness(${100 + adjustments.brightness}%)`,
            `contrast(${100 + adjustments.contrast}%)`,
            `saturate(${100 + adjustments.saturation}%)`,
            `hue-rotate(${adjustments.hue}deg)`,
            `blur(${adjustments.blur}px)`,
        ].join(' ');

        ctx.filter = filters;
        ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

        // Apply exposure and gamma adjustments
        if (adjustments.exposure !== 0 || adjustments.gamma !== 1) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                // Apply exposure
                if (adjustments.exposure !== 0) {
                    data[i] = Math.min(255, Math.max(0, data[i] * Math.pow(2, adjustments.exposure / 100)));
                    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * Math.pow(2, adjustments.exposure / 100)));
                    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * Math.pow(2, adjustments.exposure / 100)));
                }

                // Apply gamma correction
                if (adjustments.gamma !== 1) {
                    data[i] = Math.min(255, Math.max(0, Math.pow(data[i] / 255, 1 / adjustments.gamma) * 255));
                    data[i + 1] = Math.min(255, Math.max(0, Math.pow(data[i + 1] / 255, 1 / adjustments.gamma) * 255));
                    data[i + 2] = Math.min(255, Math.max(0, Math.pow(data[i + 2] / 255, 1 / adjustments.gamma) * 255));
                }
            }

            ctx.putImageData(imageData, 0, 0);
        }

        // Apply sharpening
        if (adjustments.sharpen > 0) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;

            const sharpenKernel = [
                0, -adjustments.sharpen / 100, 0,
                -adjustments.sharpen / 100, 1 + 4 * adjustments.sharpen / 100, -adjustments.sharpen / 100,
                0, -adjustments.sharpen / 100, 0
            ];

            const newData = new Uint8ClampedArray(data);

            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    for (let c = 0; c < 3; c++) {
                        let sum = 0;
                        for (let ky = -1; ky <= 1; ky++) {
                            for (let kx = -1; kx <= 1; kx++) {
                                const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                                sum += data[idx] * sharpenKernel[(ky + 1) * 3 + (kx + 1)];
                            }
                        }
                        newData[(y * width + x) * 4 + c] = Math.min(255, Math.max(0, sum));
                    }
                }
            }

            ctx.putImageData(new ImageData(newData, width, height), 0, 0);
        }
    };

    useEffect(() => {
        applyAdjustments();
    }, [adjustments]);

    const handleAdjustmentChange = (key: keyof ImageAdjustments, value: number) => {
        setAdjustments(prev => ({ ...prev, [key]: value }));
    };

    const resetAdjustments = () => {
        setAdjustments({
            brightness: 0,
            contrast: 0,
            saturation: 0,
            hue: 0,
            exposure: 0,
            gamma: 1,
            blur: 0,
            sharpen: 0,
        });
    };

    const saveImage = async () => {
        if (!canvasRef.current) return;

        setIsProcessing(true);
        try {
            const dataUrl = canvasRef.current.toDataURL('image/png');
            onImageChange(dataUrl);
            onClose();
        } catch (error) {
            console.error('Failed to save image:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const SliderControl = ({
        label,
        value,
        min,
        max,
        step = 1,
        onChange,
        unit = ''
    }: {
        label: string;
        value: number;
        min: number;
        max: number;
        step?: number;
        onChange: (value: number) => void;
        unit?: string;
    }) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[var(--foreground)]">{label}</label>
                <span className="text-sm text-[var(--muted-foreground)]">
                    {value}{unit}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-[var(--muted)] rounded-lg appearance-none cursor-pointer slider"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6 py-12">
            <div className="relative w-full max-w-6xl rounded-3xl bg-[var(--card)] p-6 shadow-2xl outline outline-1 outline-[var(--border)]">
                <button
                    className="absolute right-4 top-4 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--foreground)] shadow hover:bg-[var(--muted)]"
                    aria-label="Close editor"
                    onClick={onClose}
                >
                    ✕
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Image Preview */}
                    <div className="lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Image Preview</h3>
                        <div className="relative border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--muted)]">
                            <canvas
                                ref={canvasRef}
                                className="w-full h-auto max-h-[80vh] object-contain mx-auto"
                                style={{ display: 'block', minHeight: '300px' }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Adjustments</h3>
                            <div className="space-y-4">
                                <SliderControl
                                    label="Brightness"
                                    value={adjustments.brightness}
                                    min={-100}
                                    max={100}
                                    onChange={(value) => handleAdjustmentChange('brightness', value)}
                                    unit="%"
                                />
                                <SliderControl
                                    label="Contrast"
                                    value={adjustments.contrast}
                                    min={-100}
                                    max={100}
                                    onChange={(value) => handleAdjustmentChange('contrast', value)}
                                    unit="%"
                                />
                                <SliderControl
                                    label="Saturation"
                                    value={adjustments.saturation}
                                    min={-100}
                                    max={100}
                                    onChange={(value) => handleAdjustmentChange('saturation', value)}
                                    unit="%"
                                />
                                <SliderControl
                                    label="Hue"
                                    value={adjustments.hue}
                                    min={-180}
                                    max={180}
                                    onChange={(value) => handleAdjustmentChange('hue', value)}
                                    unit="°"
                                />
                                <SliderControl
                                    label="Exposure"
                                    value={adjustments.exposure}
                                    min={-200}
                                    max={200}
                                    onChange={(value) => handleAdjustmentChange('exposure', value)}
                                    unit="%"
                                />
                                <SliderControl
                                    label="Gamma"
                                    value={adjustments.gamma}
                                    min={0.1}
                                    max={3}
                                    step={0.1}
                                    onChange={(value) => handleAdjustmentChange('gamma', value)}
                                />
                                <SliderControl
                                    label="Blur"
                                    value={adjustments.blur}
                                    min={0}
                                    max={10}
                                    step={0.1}
                                    onChange={(value) => handleAdjustmentChange('blur', value)}
                                    unit="px"
                                />
                                <SliderControl
                                    label="Sharpen"
                                    value={adjustments.sharpen}
                                    min={0}
                                    max={100}
                                    onChange={(value) => handleAdjustmentChange('sharpen', value)}
                                    unit="%"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={resetAdjustments}
                                className="w-full rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                            >
                                Reset All
                            </button>
                            <button
                                onClick={saveImage}
                                disabled={isProcessing}
                                className="w-full rounded-lg bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Apply Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
