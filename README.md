# Base Studio

A comprehensive photo editing and blockchain token creation platform built on Base blockchain. Transform your photos with AI-powered editing tools and create meme tokens with integrated NFT experience tracking.

## Features

### 🎨 AI-Powered Photo Editing
- **RAW File Support**: Process CR2, NEF, ARW, and other professional camera formats
- **EXIF Metadata Extraction**: Preserve and display camera settings and location data
- **AI Enhancement**: OpenAI-powered image processing with persona-based editing modes
- **Real-time Preview**: Live editing with instant feedback

### 🪙 Token Creation & Management
- **Meme Token Factory**: Deploy custom tokens on Base blockchain
- **AI-Generated Metadata**: Automated token descriptions and social links
- **Lighthouse IPFS Integration**: Decentralized metadata storage
- **Portfolio Tracking**: Monitor your token performance and holdings

### 🎯 Experience & NFT System
- **Blockchain XP**: Earn experience points for platform activities
- **NFT Evolution**: Dynamic avatars that evolve based on your achievements
- **Social Features**: Share creations and track community engagement
- **Profile Dashboard**: Comprehensive stats and achievement tracking

### 💱 Trading & Liquidity
- **Uniswap V3 Integration**: Create liquidity pools for your tokens
- **Real-time Pricing**: Live market data and trading interfaces
- **Portfolio Management**: Track performance across all your assets

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Blockchain**: Wagmi, Viem, Base Network
- **AI**: OpenAI GPT-4 Vision API
- **Storage**: Lighthouse IPFS
- **Trading**: Uniswap V3 Protocol

## Getting Started

### Prerequisites
- Node.js 18+ 
- Git
- Base Sepolia testnet ETH

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/base-studio.git
cd base-studio
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp env.example .env.local
```

4. Configure your environment variables:
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_key
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_key
NEXT_PUBLIC_MEME_TOKEN_FACTORY_ADDRESS=your_factory_address
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Smart Contracts

The platform includes several smart contracts deployed on Base:

- **MemeTokenFactory**: Deploy and manage meme tokens
- **ExperienceNFT**: Track user achievements and XP
- **UniswapV3Liquidity**: Create and manage liquidity pools

### Base Network Configuration
- NEXT_PUBLIC_CHAIN_ID=84532
- NEXT_PUBLIC_RPC_URL=https://sepolia.base.org

### Contract Addresses

- **MemeTokenFactory**: `0x46474bd5bd7da8c2c6cc993f54e676efc4ec6740`
- **ExperienceNFT**: `0x917f0724a66e7928bc990b0d73d3ebe8e1392043`
- **UniswapV3Liquidity**: `0x25dee68c6b7dfa9ef1bb4c54efe0582728cf372c`

### Successful Transactions on Base

- [Transaction: 0xfd2e376eb38b2bad152e7caf068dbde50f9ca10f35a05f1ccb9f14f6823a30a5](https://sepolia.basescan.org/tx/0xfd2e376eb38b2bad152e7caf068dbde50f9ca10f35a05f1ccb9f14f6823a30a5)
- [Contract: 0x46474bd5bd7da8c2c6cc993f54e676efc4ec6740](https://sepolia.basescan.org/address/0x46474bd5bd7da8c2c6cc993f54e676efc4ec6740)
- [Contract: 0x917f0724a66e7928bc990b0d73d3ebe8e1392043](https://sepolia.basescan.org/address/0x917f0724a66e7928bc990b0d73d3ebe8e1392043)
- [Contract: 0x25dee68c6b7dfa9ef1bb4c54efe0582728cf372c](https://sepolia.basescan.org/address/0x25dee68c6b7dfa9ef1bb4c54efe0582728cf372c)

## Development

### Project Structure
```
src/
├── app/                 # Next.js app router pages
├── components/          # React components
├── lib/                 # Utilities and configurations
├── contracts/           # Smart contract ABIs
└── types/              # TypeScript type definitions
```

### Key Features Implementation
- **Image Processing**: RAW file support with dcraw integration
- **Blockchain Integration**: Wagmi hooks for wallet and contract interaction
- **AI Integration**: OpenAI API for image analysis and token generation
- **IPFS Storage**: Lighthouse SDK for decentralized metadata storage

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Join our Discord community
- Follow us on Twitter

---

Built with ❤️ on Base blockchain