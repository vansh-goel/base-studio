# WalletConnect Setup Guide

This guide will help you set up WalletConnect for mobile wallet connections in your Base Photo Studio app.

## What is WalletConnect?

WalletConnect is an open protocol that enables secure connections between dApps and mobile wallets. It allows users to connect their mobile wallets (like MetaMask Mobile, Trust Wallet, etc.) to web applications through QR codes or deep links.

## Setup Steps

### 1. Get a WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in to your account
3. Create a new project
4. Copy your Project ID

### 2. Add Environment Variable

Add your WalletConnect Project ID to your `.env.local` file:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. Deploy and Test

1. Deploy your app to Vercel
2. Open the app on your mobile device
3. Click "Mobile Wallet" to connect
4. Scan the QR code with your mobile wallet app

## Supported Mobile Wallets

WalletConnect supports hundreds of mobile wallets including:
- MetaMask Mobile
- Trust Wallet
- Coinbase Wallet
- Rainbow
- Argent
- And many more!

## How It Works

1. **Desktop Users**: Can use browser wallets (MetaMask, Coinbase Wallet extension, etc.)
2. **Mobile Users**: Can use WalletConnect to connect their mobile wallets
3. **QR Code**: Mobile users scan a QR code to establish the connection
4. **Deep Links**: Some wallets support direct deep linking

## Troubleshooting

- Make sure your WalletConnect Project ID is correctly set
- Ensure your app is deployed and accessible via HTTPS
- Check that your mobile wallet app supports WalletConnect
- Try refreshing the page if the connection fails

## Benefits

- **Mobile-First**: Works seamlessly on mobile devices
- **Secure**: Uses end-to-end encryption
- **Universal**: Works with hundreds of wallet apps
- **User-Friendly**: Simple QR code or deep link connection
