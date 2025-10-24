# Contract Deployment Guide

This guide explains how to deploy all the contracts for the 0rbit using Remix IDE.

## Contracts to Deploy

### 1. MemeTokenFactory
- **File**: `MemeTokenFactory.sol`
- **Constructor**: None (no parameters)
- **Purpose**: Factory for creating ERC20 meme tokens

### 2. ExperienceNFT
- **File**: `ExperienceNFT.sol`
- **Constructor Parameters**:
  ```solidity
  uint256[] memory xpThresholds = [0, 100, 300, 600]
  string[] memory metadataURIs = [
    "ipfs://placeholder-apprentice",
    "ipfs://placeholder-artisan", 
    "ipfs://placeholder-maestro",
    "ipfs://placeholder-visionary"
  ]
  ```
- **Purpose**: Soulbound NFT that evolves with experience points

### 3. UniswapV3Liquidity
- **File**: `UniswapV3Liquidity.sol`
- **Constructor**: None (no parameters)
- **Purpose**: Helper contract for Uniswap V3 liquidity management

## Deployment Steps

### Step 1: Open Remix IDE
1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create a new workspace or use existing one
3. Upload the contract files to the `contracts/` folder

### Step 2: Install Dependencies
Make sure you have the following OpenZeppelin contracts available:
- `@openzeppelin/contracts/token/ERC20/ERC20.sol`
- `@openzeppelin/contracts/access/Ownable.sol`
- `@openzeppelin/contracts/token/ERC721/ERC721.sol`
- `@openzeppelin/contracts/utils/Counters.sol`
- `@openzeppelin/contracts/token/ERC20/IERC20.sol`
- `@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol`

### Step 3: Deploy Contracts

#### Deploy MemeTokenFactory
1. Select `MemeTokenFactory.sol`
2. Go to "Deploy & Run Transactions" tab
3. Select your environment (MetaMask, etc.)
4. Click "Deploy" (no constructor parameters needed)
5. Copy the deployed address

#### Deploy ExperienceNFT
1. Select `ExperienceNFT.sol`
2. In the constructor parameters, enter:
   - **xpThresholds**: `[0, 100, 300, 600]`
   - **metadataURIs**: `["ipfs://placeholder-apprentice", "ipfs://placeholder-artisan", "ipfs://placeholder-maestro", "ipfs://placeholder-visionary"]`
3. Click "Deploy"
4. Copy the deployed address

#### Deploy UniswapV3Liquidity
1. Select `UniswapV3Liquidity.sol`
2. Click "Deploy" (no constructor parameters needed)
3. Copy the deployed address

### Step 4: Update Environment Variables
After deployment, update your `.env.local` file with the deployed addresses:

```env
NEXT_PUBLIC_MEME_TOKEN_FACTORY_ADDRESS=0x[deployed_address]
NEXT_PUBLIC_EXPERIENCE_NFT_ADDRESS=0x[deployed_address]
NEXT_PUBLIC_UNISWAP_V3_LIQUIDITY_ADDRESS=0x[deployed_address]
```

### Step 5: Set Experience Manager (Optional)
If you want to set an experience manager for the ExperienceNFT:

1. In Remix, find the deployed ExperienceNFT contract
2. Call the `setExperienceManager` function
3. Enter the manager address and `true` for allowed

## Network Configuration

### Local Development (Hardhat)
- **Chain ID**: 31337
- **RPC URL**: http://localhost:8545
- **Currency**: ETH

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: https://sepolia.infura.io/v3/YOUR_PROJECT_ID
- **Currency**: SepoliaETH

## Verification

After deployment, you can verify the contracts on Etherscan (for testnets/mainnet):

1. Go to the contract on Etherscan
2. Click "Verify and Publish"
3. Select "Solidity (Single file)"
4. Enter the contract source code
5. Enter constructor arguments if any
6. Click "Verify and Publish"

## Testing

### Local Testing
1. Start Hardhat node: `npx hardhat node`
2. Connect MetaMask to localhost:8545
3. Import test accounts with private keys from Hardhat
4. Deploy contracts using Remix connected to local network

### Testnet Testing
1. Get testnet ETH from faucets
2. Deploy to Sepolia testnet
3. Test all functionality before mainnet deployment

## Important Notes

- **ExperienceNFT** is soulbound (non-transferable)
- **MemeTokenFactory** creates ERC20 tokens with bonding curve mechanics
- **UniswapV3Liquidity** requires actual DAI and WETH tokens for testing
- Make sure to test all functions before mainnet deployment
- Keep track of all deployed addresses for frontend integration

## Troubleshooting

### Common Issues
1. **Insufficient funds**: Make sure you have enough ETH for gas
2. **Constructor errors**: Double-check constructor parameters
3. **Import errors**: Ensure OpenZeppelin contracts are available
4. **Network issues**: Verify you're connected to the correct network

### Getting Help
- Check Remix console for error messages
- Verify contract compilation before deployment
- Test on local network first
- Use testnet before mainnet deployment
