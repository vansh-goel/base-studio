'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast, type Toast } from '@/lib/toast-context';

const ToastComponent = ({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) => {
    const getIcon = () => {
        switch (toast.type) {
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getBgColor = () => {
        switch (toast.type) {
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'info':
                return 'bg-blue-50 border-blue-200';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
            className={`max-w-sm w-full ${getBgColor()} border rounded-lg shadow-lg p-4`}
        >
            <div className="flex items-start gap-3">
                {getIcon()}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                    {toast.description && (
                        <p className="text-sm text-gray-600 mt-1">{toast.description}</p>
                    )}
                </div>
                <button
                    onClick={() => onRemove(toast.id)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
};

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <ToastComponent
                        key={toast.id}
                        toast={toast}
                        onRemove={removeToast}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}
