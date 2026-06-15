import { MerkleTree } from "merkletreejs";
import { keccak256 } from "ethereum-cryptography/keccak";
import fs from "fs";
import path from "path";

/**
 * Merkle Tree Generator for Whitelist
 * 
 * This script generates a Merkle tree from a list of whitelisted addresses.
 * It outputs:
 * - Merkle root (for smart contract)
 * - Individual proofs for each address (for frontend)
 * 
 * Usage:
 * 1. Add whitelisted addresses to whitelist.json
 * 2. Run: npx ts-node scripts/generate-merkle-tree.ts
 * 3. Copy the root to your smart contract
 * 4. Use individual proofs in your frontend
 */

interface WhitelistEntry {
  address: string;
  proof?: string[];
}

function generateMerkleTree(addresses: string[]) {
  console.log(`🌳 Generating Merkle tree for ${addresses.length} addresses...\n`);

  // Normalize addresses to lowercase
  const normalizedAddresses = addresses.map(addr => addr.toLowerCase());

  // Create leaves by hashing each address
  const leaves = normalizedAddresses.map(addr => {
    const hash = keccak256(Buffer.from(addr.slice(2), 'hex'));
    return Buffer.from(hash);
  });

  // Create Merkle tree
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  // Get root
  const root = tree.getHexRoot();
  console.log(`✅ Merkle Root: ${root}\n`);

  // Generate proofs for each address
  const entries: WhitelistEntry[] = normalizedAddresses.map((addr, index) => {
    const proof = tree.getHexProof(leaves[index]);
    return {
      address: addresses[index], // Keep original case
      proof: proof
    };
  });

  // Save to files
  const outputDir = path.join(__dirname, "../metadata/output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save root
  fs.writeFileSync(
    path.join(outputDir, "merkle-root.json"),
    JSON.stringify({ root }, null, 2)
  );

  // Save all entries with proofs
  fs.writeFileSync(
    path.join(outputDir, "whitelist-proofs.json"),
    JSON.stringify(entries, null, 2)
  );

  console.log(`📝 Saved merkle root to: metadata/output/merkle-root.json`);
  console.log(`📝 Saved whitelist proofs to: metadata/output/whitelist-proofs.json\n`);

  // Display example
  if (entries.length > 0) {
    console.log("📋 Example proof for first address:");
    console.log(`   Address: ${entries[0].address}`);
    console.log(`   Proof: ${JSON.stringify(entries[0].proof, null, 2)}\n`);
  }

  console.log("💡 Next steps:");
  console.log("   1. Set merkle root in contract: await contract.setMerkleRoot(root)");
  console.log("   2. Use proofs in frontend for whitelist minting");
  console.log("   3. Verify: MerkleProof.verify(proof, root, leaf) should return true");

  return { root, entries };
}

// Load whitelist from JSON file
function loadWhitelist(): string[] {
  const whitelistPath = path.join(__dirname, "../metadata/whitelist.json");
  
  if (!fs.existsSync(whitelistPath)) {
    console.log("⚠️  whitelist.json not found. Creating example file...\n");
    
    const exampleWhitelist = [
      "0x1234567890123456789012345678901234567890",
      "0x2345678901234567890123456789012345678901",
      "0x3456789012345678901234567890123456789012"
    ];
    
    fs.writeFileSync(
      whitelistPath,
      JSON.stringify(exampleWhitelist, null, 2)
    );
    
    console.log(`📝 Created example whitelist at: metadata/whitelist.json`);
    console.log(`   Edit this file with your actual whitelisted addresses\n`);
    
    return exampleWhitelist;
  }

  const data = JSON.parse(fs.readFileSync(whitelistPath, "utf-8"));
  
  if (!Array.isArray(data)) {
    console.error("❌ whitelist.json must contain an array of addresses");
    process.exit(1);
  }

  return data;
}

// Main execution
const addresses = loadWhitelist();
generateMerkleTree(addresses);
