import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Replace with your deployed contract address
  const contractAddress = process.env.CONTRACT_ADDRESS || "0xYourContractAddressHere";
  const quantity = 1;

  console.log("Minting NFT(s)...");
  console.log("Contract:", contractAddress);
  console.log("Quantity:", quantity);

  const [signer] = await ethers.getSigners();
  console.log("Minting from:", signer.address);

  const NFTLaunchpad = await ethers.getContractAt("NFTLaunchpad", contractAddress);
  
  const mintPrice = await NFTLaunchpad.mintPrice();
  const totalCost = mintPrice * BigInt(quantity);

  console.log(`Total cost: ${ethers.formatEther(totalCost)} ETH`);

  try {
    const tx = await NFTLaunchpad.mint(quantity, { value: totalCost });
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("✅ Mint successful! Block:", receipt?.blockNumber);
    
    // Log the minted token IDs
    const filter = NFTLaunchpad.filters.Transfer(null, signer.address);
    const events = await NFTLaunchpad.queryFilter(filter, receipt?.blockNumber, receipt?.blockNumber);
    
    for (const event of events) {
      if ('args' in event && event.args) {
        console.log(`🎉 Minted Token ID: ${event.args.tokenId.toString()}`);
      }
    }
  } catch (error) {
    console.error("❌ Mint failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
