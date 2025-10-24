// Final improvements and bug fixes - 2025-10-24T15:36:53.369Z
'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { User, Wallet as WalletIcon, Smartphone, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/lib/toast-context';
// Improved wallet accessibility


interface WalletConnectProps {
    onConnect?: () => void;
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
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

    const getConnectorIcon = (connectorName: string) => {
        if (connectorName.toLowerCase().includes('walletconnect')) {
            return <Smartphone className="w-4 h-4" />;
        }
        if (connectorName.toLowerCase().includes('injected')) {
            return <Monitor className="w-4 h-4" />;
        }
        return <WalletIcon className="w-4 h-4" />;
    };

    const getConnectorLabel = (connectorName: string) => {
        if (connectorName.toLowerCase().includes('walletconnect')) {
            return 'Mobile Wallet';
        }
        if (connectorName.toLowerCase().includes('injected')) {
            return 'Browser Wallet';
        }
        return connectorName;
    };

    return (
        <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="text-center">
                <p className="text-sm text-[var(--muted-foreground)] mb-3">Connect your wallet to continue</p>
            </div>
            <div className="flex flex-col gap-2">
                {connectors.map((connector) => (
                    <Button
                        key={connector.uid}
                        variant="secondary"
                        size="lg"
                        onClick={async () => {
                            try {
                                await connect({ connector });
                                onConnect?.();
                            } catch (error) {
                                // Error is already handled by the mutation onError callback
                                console.log('Connection attempt failed, handled by toast notification');
                            }
                        }}
                        disabled={isPending}
                        className="flex items-center justify-center gap-3 bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--foreground)] border-[var(--border)] hover:border-[var(--foreground)] py-3"
                    >
                        {getConnectorIcon(connector.name)}
                        <span className="font-medium">
                            {isPending ? 'Connecting...' : getConnectorLabel(connector.name)}
                        </span>
                    </Button>
                ))}
            </div>
            <div className="text-center">
                <p className="text-xs text-[var(--muted-foreground)]">
                    Mobile users: Use "Mobile Wallet" to connect with WalletConnect
                </p>
            </div>
        </motion.div>
    );
}

// Alias for consistency
export const OnchainKitConnect = WalletConnect;

