'use client';

import { useState, useRef, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Camera, Upload, X, Check, Loader2, Shuffle } from 'lucide-react';
import { useToast } from '@/lib/toast-context';
import { getCachedAvatars, refreshCachedAvatars } from '@/lib/avatarCache';

interface UserPhotoUploadProps {
    currentImageUrl?: string | null;
    onPhotoUpdate?: (imageUrl: string) => void;
    size?: 'sm' | 'md' | 'lg';
    showEditButton?: boolean;
}

export function UserPhotoUpload({
    currentImageUrl,
    onPhotoUpdate,
    size = 'md',
    showEditButton = true
}: UserPhotoUploadProps) {
    const { address } = useAccount();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [randomAvatars, setRandomAvatars] = useState<string[]>([]);
    const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-20 h-20'
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    // Load cached avatars on component mount
    useEffect(() => {
        const loadAvatars = async () => {
            setIsLoadingAvatars(true);
            try {
                const avatars = await getCachedAvatars();
                setRandomAvatars(avatars);
            } catch (error) {
                console.error('Error loading cached avatars:', error);
                toast.error('Avatar Error', 'Failed to load avatars');
            } finally {
                setIsLoadingAvatars(false);
            }
        };

        // Load avatars immediately when component mounts
        loadAvatars();
    }, []);

    // Refresh avatars with new set
    const refreshAvatars = async () => {
        setIsLoadingAvatars(true);
        try {
            const avatars = await refreshCachedAvatars();
            setRandomAvatars(avatars);
        } catch (error) {
            console.error('Error refreshing avatars:', error);
            toast.error('Avatar Error', 'Failed to refresh avatars');
        } finally {
            setIsLoadingAvatars(false);
        }
    };

    // Handle avatar selection
    const handleAvatarSelect = (avatarUrl: string) => {
        setPreviewUrl(avatarUrl);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Invalid File', 'Please select an image file.');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File Too Large', 'Please select an image smaller than 5MB.');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreviewUrl(result);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () => {
        if (!address || !previewUrl) {
            console.error('Missing address or previewUrl:', { address, previewUrl });
            return;
        }

        console.log('Uploading photo:', {
            address,
            previewUrlLength: previewUrl.length,
            previewUrlType: typeof previewUrl,
            previewUrlStart: previewUrl.substring(0, 50)
        });

        setIsUploading(true);
        try {
            // Save directly to localStorage instead of API
            console.log('Saving photo to localStorage:', previewUrl);

            // Call the update function with the base64 image
            onPhotoUpdate?.(previewUrl);

            toast.success('Photo Updated', 'Your profile photo has been updated successfully!');
            setShowUploadModal(false);

        } catch (error) {
            console.error('Error saving photo:', error);
            toast.error('Save Failed', 'Failed to save your photo. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemovePhoto = async () => {
        if (!address) return;

        try {
            // For now, just clear the local state
            // In a real app, you might want to store a "deleted" flag in IPFS
            setPreviewUrl(null);
            onPhotoUpdate?.('');
            toast.success('Photo Removed', 'Your profile photo has been removed.');
        } catch (error) {
            console.error('Error removing photo:', error);
            toast.error('Remove Failed', 'Failed to remove your photo. Please try again.');
        }
    };

    return (
        <>
            <div className="relative group">
                <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden border-2 border-[var(--border)] bg-[var(--card)] flex items-center justify-center`}>
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="Profile photo"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full gradient-base flex items-center justify-center">
                            <Camera className={`${iconSizes[size]} text-white`} />
                        </div>
                    )}
                </div>

                {showEditButton && (
                    <motion.button
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-[var(--background)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setShowUploadModal(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Camera className="w-3 h-3 text-white" />
                    </motion.button>
                )}
            </div>

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
                        <motion.div
                            className="w-full max-w-md rounded-2xl bg-[var(--card)] p-6 shadow-2xl"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold">Update Profile Photo</h3>
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="p-1 rounded-full hover:bg-[var(--muted)] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Current/Preview Photo */}
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full gradient-base flex items-center justify-center">
                                                <Camera className="w-8 h-8 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Random Avatars */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="text-sm font-medium">Choose Random Avatar</h4>
                                        <Button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                refreshAvatars();
                                            }}
                                            variant="ghost"
                                            size="sm"
                                            disabled={isLoadingAvatars}
                                            className="text-xs"
                                            type="button"
                                        >
                                            <Shuffle className="w-3 h-3 mr-1" />
                                            {isLoadingAvatars ? 'Loading...' : 'New Set'}
                                        </Button>
                                    </div>

                                    <div className="flex gap-2 justify-center">
                                        {isLoadingAvatars ? (
                                            <div className="flex gap-2">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <div key={i} className="w-12 h-12 rounded-full bg-muted animate-pulse" />
                                                ))}
                                            </div>
                                        ) : (
                                            randomAvatars.map((avatar, index) => (
                                                <motion.button
                                                    key={index}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleAvatarSelect(avatar);
                                                    }}
                                                    className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${previewUrl === avatar
                                                        ? 'border-primary ring-2 ring-primary/20'
                                                        : 'border-border hover:border-primary/50'
                                                        }`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    type="button"
                                                >
                                                    <img
                                                        src={avatar}
                                                        alt={`Random avatar ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </motion.button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* File Input */}
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <Button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            fileInputRef.current?.click();
                                        }}
                                        variant="outline"
                                        className="w-full"
                                        disabled={isUploading}
                                        type="button"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {previewUrl ? 'Change Photo' : 'Upload Custom Photo'}
                                    </Button>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleUpload();
                                        }}
                                        disabled={!previewUrl || isUploading}
                                        className="flex-1"
                                        type="button"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Upload
                                            </>
                                        )}
                                    </Button>

                                    {previewUrl && (
                                        <Button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRemovePhoto();
                                            }}
                                            variant="outline"
                                            className="flex-1"
                                            disabled={isUploading}
                                            type="button"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
