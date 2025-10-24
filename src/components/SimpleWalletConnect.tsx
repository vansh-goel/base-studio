'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { User, Wallet as WalletIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast-context';

interface SimpleWalletConnectProps {
    onConnect?: () => void;
}

export function SimpleWalletConnect({ onConnect }: SimpleWalletConnectProps) {
    const { address, isConnected } = useAccount();
    const [isHydrated, setIsHydrated] = useState(false);
    const toast = useToast();

    const { connect, connectors, isPending } = useConnect({
        mutation: {
            onError: (error) => {
                console.error('Wallet connection error:', error);
                // Handle different error types gracefully
                if (error.message.includes('User rejected') || error.message.includes('UserRejectedRequestError')) {
                    toast.warning('Connection Cancelled', 'You cancelled the wallet connection request.');
                } else if (error.message.includes('chain')) {
                    toast.error('Wrong Network', 'Please switch to Base Sepolia network in your wallet.');
                } else if (error.message.includes('rejected') || error.message.includes('Connection request reset')) {
                    toast.error('Connection Rejected', 'Please approve the connection in your wallet.');
                } else {
                    toast.error('Connection Failed', 'Unable to connect to wallet. Please try again.');
                }
            },
            onSuccess: () => {
                toast.success('Wallet Connected', 'Successfully connected to your wallet!');
                onConnect?.();
            }
        }
    });
    const { disconnect } = useDisconnect();

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

    // Filter to only show injected wallet (MetaMask, etc.)
    const injectedConnector = connectors.find(connector =>
        connector.name.toLowerCase().includes('injected') ||
        connector.name.toLowerCase().includes('metamask')
    );

    if (!injectedConnector) {
        return (
            <div className="text-center">
                <p className="text-sm text-white/70">No wallet found</p>
            </div>
        );
    }

    return (
        <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                    try {
                        await connect({ connector: injectedConnector });
                        onConnect?.();
                    } catch (error) {
                        // Error is already handled by the mutation onError callback
                        console.log('Connection attempt failed, handled by toast notification');
                    }
                }}
                disabled={isPending}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 text-xs sm:text-sm px-3 sm:px-4 py-2"
            >
                <WalletIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                    {isPending ? 'Connecting...' : 'Connect Wallet'}
                </span>
                <span className="sm:hidden">
                    {isPending ? '...' : 'Connect'}
                </span>
            </Button>
        </motion.div>
    );
}
