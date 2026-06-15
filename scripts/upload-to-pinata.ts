import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_SECRET_KEY)) {
  console.error("❌ Please set PINATA_JWT or PINATA_API_KEY and PINATA_SECRET_KEY in .env");
  process.exit(1);
}

const PINATA_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

const headers = PINATA_JWT 
  ? { Authorization: `Bearer ${PINATA_JWT}` }
  : { pinata_api_key: PINATA_API_KEY, pinata_secret_api_key: PINATA_SECRET_KEY };

async function uploadFile(filePath: string, name: string) {
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  const pinataMetadata = JSON.stringify({ name });
  data.append("pinataMetadata", pinataMetadata);

  try {
    const res = await axios.post(PINATA_URL, data, {
      maxBodyLength: Infinity,
      headers: {
        ...headers,
        ...data.getHeaders(),
      },
    });
    console.log(`✅ Uploaded ${name}: ipfs://${res.data.IpfsHash}`);
    return res.data.IpfsHash;
  } catch (error) {
    console.error(`❌ Failed to upload ${name}:`, error);
    return null;
  }
}

async function uploadJSON(json: any, name: string) {
  try {
    const res = await axios.post(PINATA_JSON_URL, json, {
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    });
    console.log(`✅ Uploaded JSON ${name}: ipfs://${res.data.IpfsHash}`);
    return res.data.IpfsHash;
  } catch (error) {
    console.error(`❌ Failed to upload JSON ${name}:`, error);
    return null;
  }
}

async function main() {
  const imagesDir = path.join(__dirname, "../metadata/images");
  const outputDir = path.join(__dirname, "../metadata/output");

  if (!fs.existsSync(imagesDir)) {
    console.log(`ℹ️ Creating ${imagesDir}. Please add your NFT images here (1.png, 2.png, etc.)`);
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(imagesDir).filter(f => f.endsWith(".png") || f.endsWith(".jpg"));
  
  if (files.length === 0) {
    console.log("⚠️ No images found in metadata/images/. Skipping upload.");
    console.log("💡 Add images like 1.png, 2.png, etc. to generate metadata.");
    return;
  }

  console.log(`🚀 Starting upload of ${files.length} images...`);

  for (const file of files) {
    const tokenId = path.parse(file).name;
    const filePath = path.join(imagesDir, file);
    
    // Upload image
    const imageHash = await uploadFile(filePath, `NFT_Image_${tokenId}`);
    if (!imageHash) continue;

    // Create metadata JSON
    const metadata = {
      name: `My Awesome NFT #${tokenId}`,
      description: `This is the description for NFT #${tokenId}. Fully customizable template.`,
      image: `ipfs://${imageHash}`,
      attributes: [
        { trait_type: "Background", value: "Blue" },
        { trait_type: "Rarity", value: "Common" },
      ],
    };

    // Upload metadata JSON
    const jsonHash = await uploadJSON(metadata, `Metadata_${tokenId}`);
    if (jsonHash) {
      fs.writeFileSync(
        path.join(outputDir, `${tokenId}.json`),
        JSON.stringify(metadata, null, 2)
      );
    }
  }

  console.log("\n🎉 Upload complete!");
  console.log("💡 Next step: Upload the 'metadata/output' folder to Pinata, or use the base folder hash.");
  console.log("💡 Set the base URI in your contract to: ipfs://<OUTPUT_FOLDER_HASH>/");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
