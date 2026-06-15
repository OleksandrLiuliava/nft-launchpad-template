// ==========================================
// FRONTEND CONFIGURATION
// Change these values to customize your launchpad
// ==========================================

export const CONFIG = {
  // Contract address (update after deployment)
  CONTRACT_ADDRESS: import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
  
  // Network configuration (Sepolia testnet)
  CHAIN_ID: 11155111,
  CHAIN_NAME: "Sepolia",
  RPC_URL: import.meta.env.VITE_RPC_URL || "https://rpc.sepolia.org",
  
  // Collection details
  COLLECTION_NAME: "My Awesome NFT",
  COLLECTION_DESCRIPTION: "A fully customizable NFT launchpad template. Easy to fork, clean code, production-ready.",
  
  // Minting limits
  MAX_PER_WALLET: 5,
  
  // OpenSea testnet URL prefix
  OPENSEA_BASE_URL: "https://testnets.opensea.io/assets/sepolia/",
  
  // Owner address for admin panel access check
  OWNER_ADDRESS: import.meta.env.VITE_OWNER_ADDRESS || "",
};
