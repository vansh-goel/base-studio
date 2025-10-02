// Final improvements and bug fixes - 2025-10-24T15:36:53.369Z
'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { User, Wallet as WalletIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
// Improved wallet accessibility


interface WalletConnectProps {
    onConnect?: () => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Show loading state during hydration
    if (!isHydrated) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-9 w-20 rounded-lg bg-[var(--muted)] animate-pulse" />
            </div>
        );
    }

    if (isConnected) {
        return (
            <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">
                        {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => disconnect()}
                    className="hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive"
                >
                    Disconnect
                </Button>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {connectors.map((connector) => (
                <Button
                    key={connector.uid}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                        connect({ connector });
                        onConnect?.();
                    }}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30"
                >
                    <WalletIcon className="w-4 h-4" />
                    {isPending ? 'Connecting...' : connector.name}
                </Button>
            ))}
        </motion.div>
    );
}

// Alias for consistency
export const OnchainKitConnect = WalletConnect;

