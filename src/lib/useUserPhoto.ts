'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';

export function useUserPhoto() {
    const { address } = useAccount();
    const [userPhotoUrl, setUserPhotoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Get localStorage key for this wallet
    const getStorageKey = useCallback((walletAddress: string) => {
        return `user-photo-${walletAddress.toLowerCase()}`;
    }, []);

    // Load user photo from localStorage
    const loadUserPhoto = useCallback(() => {
        if (!address) {
            console.log('useUserPhoto: No address, setting photo to null');
            setUserPhotoUrl(null);
            return;
        }

        console.log('useUserPhoto: Loading photo from localStorage for address:', address);
        setIsLoading(true);
        setError(null);

        try {
            const storageKey = getStorageKey(address);
            const storedPhoto = localStorage.getItem(storageKey);

            if (storedPhoto) {
                console.log('useUserPhoto: Found stored photo:', storedPhoto);
                setUserPhotoUrl(storedPhoto);
            } else {
                console.log('useUserPhoto: No photo found in localStorage');
                setUserPhotoUrl(null);
            }
        } catch (err) {
            console.error('Error loading user photo from localStorage:', err);
            setError(err instanceof Error ? err.message : 'Failed to load photo');
            setUserPhotoUrl(null);
        } finally {
            setIsLoading(false);
        }
    }, [address, getStorageKey]);

    // Update user photo
    const updateUserPhoto = useCallback((imageUrl: string) => {
        console.log('updateUserPhoto called with:', imageUrl);

        if (!address) {
            console.log('useUserPhoto: No address, cannot save photo');
            return;
        }

        try {
            const storageKey = getStorageKey(address);

            if (imageUrl) {
                // Save to localStorage
                localStorage.setItem(storageKey, imageUrl);
                console.log('useUserPhoto: Photo saved to localStorage');
            } else {
                // Remove from localStorage
                localStorage.removeItem(storageKey);
                console.log('useUserPhoto: Photo removed from localStorage');
            }

            setUserPhotoUrl(imageUrl);
        } catch (err) {
            console.error('Error saving user photo to localStorage:', err);
            setError(err instanceof Error ? err.message : 'Failed to save photo');
        }
    }, [address, getStorageKey]);

    // Remove user photo
    const removeUserPhoto = useCallback(() => {
        console.log('useUserPhoto: Removing photo');
        updateUserPhoto('');
    }, [updateUserPhoto]);

    // Load photo when address changes
    useEffect(() => {
        console.log('useUserPhoto: useEffect triggered, address:', address);
        loadUserPhoto();
    }, [loadUserPhoto]);

    return {
        userPhotoUrl,
        isLoading,
        error,
        fetchUserPhoto: loadUserPhoto, // Keep same API for compatibility
        updateUserPhoto,
        removeUserPhoto
    };
}
