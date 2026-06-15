import { run, ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const contractAddress = process.argv[2];

  if (!contractAddress) {
    console.error("Please provide the contract address as an argument.");
    console.log("Usage: npx hardhat run scripts/verify.ts --network sepolia <contract_address>");
    process.exit(1);
  }

  console.log("Verifying NFTLaunchpad at:", contractAddress);

  // ==========================================
  // MUST MATCH DEPLOYMENT PARAMETERS EXACTLY
  // ==========================================
  const name = "My Awesome NFT";
  const symbol = "MANFT";
  const maxSupply = 1000;
  const maxPerWallet = 5;
  const mintPrice = ethers.parseEther("0.01");
  const royaltyReceiver = process.env.DEPLOYER_ADDRESS || (await ethers.getSigners())[0].address;
  const royaltyFeeNumerator = 500;
  const hiddenURI = "ipfs://QmHiddenURI/hidden.json";

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [
        name,
        symbol,
        maxSupply,
        maxPerWallet,
        mintPrice,
        royaltyReceiver,
        royaltyFeeNumerator,
        hiddenURI,
      ],
    });
    console.log("✅ Contract verified successfully!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
