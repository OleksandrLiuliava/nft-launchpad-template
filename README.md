# 🎨 NFT Launchpad Template

A production-ready, fully customizable NFT launchpad template built with Hardhat, React, TypeScript, and TailwindCSS. Designed for Sepolia testnet deployment.

## ✨ Features

- **Smart Contract**
  - ERC-721 with EIP-2981 royalties
  - Configurable max supply, mint price, max per wallet
  - Whitelist phase (Merkle tree) + Public phase
  - Reveal mechanic (hidden → revealed metadata)
  - Owner controls: pause, withdraw, set base URI, set price
  - 100% test coverage

- **Frontend**
  - Modern React + TypeScript + TailwindCSS
  - Mobile responsive design
  - Mint page with live counter and wallet integration
  - Admin panel for contract management
  - NFT gallery with OpenSea integration
  - MetaMask integration with ethers.js

- **IPFS Integration**
  - Pinata upload scripts
  - Auto-generated metadata JSON

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Sepolia testnet ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd "NFT Launchpad"
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add:
- `PRIVATE_KEY`: Your wallet private key (NEVER commit this!)
- `SEPOLIA_RPC_URL`: Get free from [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)
- `ETHERSCAN_API_KEY`: Get from [Etherscan](https://etherscan.io/myapikey)

### 3. Deploy Contract

```bash
# Compile contracts
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

Copy the deployed contract address and update:
- `.env` → `CONTRACT_ADDRESS`
- `client/.env` → `VITE_CONTRACT_ADDRESS`
- `client/.env` → `VITE_OWNER_ADDRESS` (your wallet address)

### 4. Verify Contract (Optional)

```bash
npm run verify:sepolia <contract_address>
```

### 5. Run Frontend

```bash
cd client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 Customization Guide

### Smart Contract

Edit `scripts/deploy.ts`:

```typescript
const name = "Your Collection Name";
const symbol = "SYMBOL";
const maxSupply = 1000;
const maxPerWallet = 5;
const mintPrice = ethers.parseEther("0.01"); // 0.01 ETH
const royaltyFeeNumerator = 500; // 5%
const hiddenURI = "ipfs://Qm.../hidden.json";
```

### Frontend

Edit `client/src/config.ts`:

```typescript
export const CONFIG = {
  CONTRACT_ADDRESS: "0x...",
  COLLECTION_NAME: "Your Collection Name",
  COLLECTION_DESCRIPTION: "Your description here",
  MAX_PER_WALLET: 5,
  // ...
};
```

### Styling

Edit `client/tailwind.config.js` to change colors:

```javascript
colors: {
  primary: "#6366f1",    // Your brand color
  secondary: "#8b5cf6",  // Secondary color
  dark: "#0f172a",       // Background
  darker: "#020617",     // Darker background
}
```

## 📦 Project Structure

```
NFT Launchpad/
├── contracts/
│   └── NFTLaunchpad.sol       # Main smart contract
├── scripts/
│   ├── deploy.ts              # Deployment script
│   ├── verify.ts              # Etherscan verification
│   ├── mint.ts                # Test minting
│   └── upload-to-pinata.ts    # IPFS upload
├── test/
│   └── NFTLaunchpad.test.ts   # Contract tests
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MintPage.tsx   # Main minting page
│   │   │   ├── AdminPage.tsx  # Admin controls
│   │   │   └── GalleryPage.tsx # NFT gallery
│   │   ├── config.ts          # Frontend config
│   │   └── App.tsx            # Main app
│   └── package.json
├── hardhat.config.ts
├── package.json
└── README.md
```

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all tests
npm test

# Run with coverage
npx hardhat coverage
```

### Local Development

```bash
# Start local Hardhat node
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost

# Run frontend
cd client && npm run dev
```

## 📸 IPFS Metadata Upload

### 1. Prepare Images

Place your NFT images in `metadata/images/` as `1.png`, `2.png`, etc.

### 2. Upload to Pinata

```bash
npm run upload:pinata
```

This will:
- Upload each image to IPFS
- Generate metadata JSON for each token
- Save metadata to `metadata/output/`

### 3. Upload Metadata Folder

Upload the entire `metadata/output/` folder to Pinata to get a base URI.

### 4. Set Base URI

Use the admin panel or contract function:

```typescript
await contract.setBaseURI("ipfs://QmYourFolderHash/");
await contract.toggleReveal();
```

## 🔐 Admin Functions

Access the admin panel at `/admin` (owner only):

- **Set Mint Price**: Change the mint price
- **Set Base URI**: Update metadata URI
- **Toggle Reveal**: Switch from hidden to revealed metadata
- **Pause/Unpause**: Control minting
- **Withdraw**: Withdraw all ETH to owner

## 🌐 MetaMask Setup

### Add Sepolia Testnet

1. Open MetaMask
2. Click network dropdown → "Add network"
3. Click "Add a network manually"
4. Enter:
   - Network Name: Sepolia
   - RPC URL: `https://rpc.sepolia.org`
   - Chain ID: `11155111`
   - Currency Symbol: `SEP`
   - Block Explorer: `https://sepolia.etherscan.io`

### Get Free Sepolia ETH

1. Visit [sepoliafaucet.com](https://sepoliafaucet.com)
2. Connect your wallet
3. Request test ETH
4. Wait 1-2 minutes for confirmation

## 🖼️ View on OpenSea Testnet

After minting, view your NFTs at:

```
https://testnets.opensea.io/assets/sepolia/<contract_address>/<token_id>
```

Or visit the `/gallery` page in the frontend.

## 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run compile` | Compile smart contracts |
| `npm test` | Run contract tests |
| `npm run deploy:sepolia` | Deploy to Sepolia |
| `npm run verify:sepolia` | Verify on Etherscan |
| `npm run mint:test` | Test mint from CLI |
| `npm run upload:pinata` | Upload images to IPFS |
| `npm run client:dev` | Start frontend dev server |
| `npm run client:build` | Build frontend for production |

## 🛠️ Troubleshooting

### "Insufficient payment" error
- Check that you're sending enough ETH
- Verify the mint price in the contract

### "Exceeds max per wallet" error
- You've reached the max mints per wallet
- Use a different wallet or wait for admin to increase limit

### Contract verification fails
- Ensure constructor arguments match exactly
- Check that Etherscan API key is correct
- Wait 30 seconds after deployment before verifying

### Frontend can't connect to contract
- Verify contract address in `client/.env`
- Check that you're on Sepolia network in MetaMask
- Ensure RPC URL is correct

## 📚 Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [ethers.js Documentation](https://docs.ethers.org/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Pinata IPFS](https://docs.pinata.cloud/)

## 🤝 Contributing

This is a template project. Feel free to fork and customize for your needs!

## 📄 License

MIT License - feel free to use this template for your own projects!

## ⚠️ Disclaimer

This is a **testnet-only** template for educational purposes. Do not use for mainnet without thorough security audits.

---

Built with ❤️ for the Web3 community
