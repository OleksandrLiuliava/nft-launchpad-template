import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("Deploying NFTLaunchpad...");

  // ==========================================
  // CONFIGURABLE DEPLOYMENT PARAMETERS
  // ==========================================
  const name = "My Awesome NFT";
  const symbol = "MANFT";
  const maxSupply = 1000;
  const maxPerWallet = 5;
  const mintPrice = ethers.parseEther("0.01"); // 0.01 ETH
  const royaltyReceiver = process.env.DEPLOYER_ADDRESS || (await ethers.getSigners())[0].address;
  const royaltyFeeNumerator = 500; // 5% (500 / 10000)
  const hiddenURI = "ipfs://QmHiddenURI/hidden.json";

  const NFTLaunchpad = await ethers.getContractFactory("NFTLaunchpad");
  const nftLaunchpad = await NFTLaunchpad.deploy(
    name,
    symbol,
    maxSupply,
    maxPerWallet,
    mintPrice,
    royaltyReceiver,
    royaltyFeeNumerator,
    hiddenURI
  );

  await nftLaunchpad.waitForDeployment();
  const address = await nftLaunchpad.getAddress();

  console.log("✅ NFTLaunchpad deployed to:", address);
  console.log("📝 Save this address for your frontend config!");
  console.log("🔗 Verify with: npx hardhat verify --network sepolia", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
