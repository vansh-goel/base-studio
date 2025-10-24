'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Toast {
    id: string;
    title: string;
    description?: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    success: (title: string, description?: string) => string;
    error: (title: string, description?: string) => string;
    warning: (title: string, description?: string) => string;
    info: (title: string, description?: string) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        const duration = toast.duration || 5000;
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const success = useCallback((title: string, description?: string) => {
        return addToast({ title, description, type: 'success' });
    }, [addToast]);

    const error = useCallback((title: string, description?: string) => {
        return addToast({ title, description, type: 'error' });
    }, [addToast]);

    const warning = useCallback((title: string, description?: string) => {
        return addToast({ title, description, type: 'warning' });
    }, [addToast]);

    const info = useCallback((title: string, description?: string) => {
        return addToast({ title, description, type: 'info' });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{
            toasts,
            addToast,
            removeToast,
            success,
            error,
            warning,
            info,
        }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
