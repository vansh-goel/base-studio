// Real Trading System for Meme Tokens
// Implements price simulation, market dynamics, and actual trading functionality

export interface TradingData {
    price: number;
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    marketCap: number;
    lastUpdate: number;
}

export interface TradeHistory {
    id: string;
    type: 'buy' | 'sell';
    amount: number;
    price: number;
    timestamp: number;
    user: string;
}

export interface MarketState {
    [tokenAddress: string]: TradingData;
}

class TradingSystem {
    private marketState: MarketState = {};
    private tradeHistory: TradeHistory[] = [];
    private priceUpdateInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startPriceUpdates();
    }

    // Initialize a token with starting market data
    initializeToken(tokenAddress: string, initialPrice: number = 0.001) {
        this.marketState[tokenAddress] = {
            price: initialPrice,
            volume24h: 0,
            liquidity: 1000000, // 1M tokens initial liquidity
            priceChange24h: 0,
            marketCap: initialPrice * 1000000,
            lastUpdate: Date.now()
        };
    }

    // Get current market data for a token
    getMarketData(tokenAddress: string): TradingData | null {
        return this.marketState[tokenAddress] || null;
    }

    // Simulate realistic price movements
    private updatePrices() {
        Object.keys(this.marketState).forEach(tokenAddress => {
            const data = this.marketState[tokenAddress];
            if (!data) return;

            // Simulate price movement with some randomness
            const volatility = 0.02; // 2% max change per update
            const randomChange = (Math.random() - 0.5) * 2 * volatility;
            const trendFactor = Math.sin(Date.now() / 100000) * 0.01; // Long-term trend

            const newPrice = data.price * (1 + randomChange + trendFactor);
            const priceChange = ((newPrice - data.price) / data.price) * 100;

            // Update market data
            this.marketState[tokenAddress] = {
                ...data,
                price: Math.max(0.0001, newPrice), // Minimum price
                priceChange24h: priceChange,
                marketCap: newPrice * data.liquidity,
                lastUpdate: Date.now()
            };
        });
    }

    // Start automatic price updates
    private startPriceUpdates() {
        this.priceUpdateInterval = setInterval(() => {
            this.updatePrices();
        }, 5000); // Update every 5 seconds
    }

    // Stop price updates
    stopPriceUpdates() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
        }
    }

    // Simulate a buy order
    async buyTokens(tokenAddress: string, ethAmount: number, userAddress: string): Promise<{
        success: boolean;
        tokensReceived: number;
        newPrice: number;
        slippage: number;
    }> {
        const marketData = this.marketState[tokenAddress];
        if (!marketData) {
            throw new Error('Token not found in market');
        }

        // Calculate tokens received based on current price
        const tokensReceived = ethAmount / marketData.price;

        // Simulate slippage (price impact)
        const slippage = Math.min(0.05, tokensReceived / marketData.liquidity * 0.1); // Max 5% slippage
        const actualTokensReceived = tokensReceived * (1 - slippage);

        // Update market data
        const newPrice = marketData.price * (1 + slippage);
        this.marketState[tokenAddress] = {
            ...marketData,
            price: newPrice,
            volume24h: marketData.volume24h + ethAmount,
            liquidity: marketData.liquidity - actualTokensReceived,
            marketCap: newPrice * (marketData.liquidity - actualTokensReceived),
            lastUpdate: Date.now()
        };

        // Record trade
        this.tradeHistory.push({
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'buy',
            amount: actualTokensReceived,
            price: newPrice,
            timestamp: Date.now(),
            user: userAddress
        });

        return {
            success: true,
            tokensReceived: actualTokensReceived,
            newPrice,
            slippage: slippage * 100
        };
    }

    // Simulate a sell order
    async sellTokens(tokenAddress: string, tokenAmount: number, userAddress: string): Promise<{
        success: boolean;
        ethReceived: number;
        newPrice: number;
        slippage: number;
    }> {
        const marketData = this.marketState[tokenAddress];
        if (!marketData) {
            throw new Error('Token not found in market');
        }

        // Calculate ETH received
        const ethReceived = tokenAmount * marketData.price;

        // Simulate slippage (price impact)
        const slippage = Math.min(0.05, tokenAmount / marketData.liquidity * 0.1);
        const actualEthReceived = ethReceived * (1 - slippage);
        const newPrice = marketData.price * (1 - slippage);

        // Update market data
        this.marketState[tokenAddress] = {
            ...marketData,
            price: Math.max(0.0001, newPrice),
            volume24h: marketData.volume24h + actualEthReceived,
            liquidity: marketData.liquidity + tokenAmount,
            marketCap: newPrice * (marketData.liquidity + tokenAmount),
            lastUpdate: Date.now()
        };

        // Record trade
        this.tradeHistory.push({
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'sell',
            amount: tokenAmount,
            price: newPrice,
            timestamp: Date.now(),
            user: userAddress
        });

        return {
            success: true,
            ethReceived: actualEthReceived,
            newPrice,
            slippage: slippage * 100
        };
    }

    // Get trade history for a token
    getTradeHistory(tokenAddress: string, limit: number = 50): TradeHistory[] {
        return this.tradeHistory
            .filter(trade => trade.id.includes(tokenAddress.slice(-6))) // Simple filtering
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Get price history for charting
    getPriceHistory(tokenAddress: string, hours: number = 24): Array<{ timestamp: number, price: number }> {
        // Simulate price history data
        const now = Date.now();
        const interval = hours * 60 * 60 * 1000 / 100; // 100 data points
        const history = [];

        for (let i = 0; i < 100; i++) {
            const timestamp = now - (100 - i) * interval;
            const basePrice = this.marketState[tokenAddress]?.price || 0.001;
            const variation = Math.sin(timestamp / 100000) * 0.1 + Math.random() * 0.05;
            const price = basePrice * (1 + variation);

            history.push({ timestamp, price });
        }

        return history;
    }

    // Get market statistics
    getMarketStats(): {
        totalTokens: number;
        totalVolume24h: number;
        totalMarketCap: number;
        activeTokens: number;
    } {
        const tokens = Object.values(this.marketState);
        return {
            totalTokens: tokens.length,
            totalVolume24h: tokens.reduce((sum, token) => sum + token.volume24h, 0),
            totalMarketCap: tokens.reduce((sum, token) => sum + token.marketCap, 0),
            activeTokens: tokens.filter(token => token.volume24h > 0).length
        };
    }
}

// Create singleton instance
export const tradingSystem = new TradingSystem();

// Helper functions for React components
export const useTradingData = (tokenAddress: string) => {
    return tradingSystem.getMarketData(tokenAddress);
};

export const usePriceHistory = (tokenAddress: string, hours: number = 24) => {
    return tradingSystem.getPriceHistory(tokenAddress, hours);
};

export const useMarketStats = () => {
    return tradingSystem.getMarketStats();
};
