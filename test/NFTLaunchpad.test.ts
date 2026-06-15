import { expect } from "chai";
import { ethers } from "hardhat";
import { NFTLaunchpad } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("NFTLaunchpad", function () {
  let nftLaunchpad: NFTLaunchpad;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  const NAME = "Test NFT";
  const SYMBOL = "TNFT";
  const MAX_SUPPLY = 100;
  const MAX_PER_WALLET = 5;
  const MINT_PRICE = ethers.parseEther("0.01");
  const ROYALTY_FEE = 500; // 5%
  const HIDDEN_URI = "ipfs://hidden/";

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const NFTLaunchpadFactory = await ethers.getContractFactory("NFTLaunchpad");
    nftLaunchpad = await NFTLaunchpadFactory.deploy(
      NAME,
      SYMBOL,
      MAX_SUPPLY,
      MAX_PER_WALLET,
      MINT_PRICE,
      owner.address,
      ROYALTY_FEE,
      HIDDEN_URI
    );
    await nftLaunchpad.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftLaunchpad.owner()).to.equal(owner.address);
    });

    it("Should set correct max supply and mint price", async function () {
      expect(await nftLaunchpad.MAX_SUPPLY()).to.equal(MAX_SUPPLY);
      expect(await nftLaunchpad.mintPrice()).to.equal(MINT_PRICE);
    });

    it("Should set correct royalty info", async function () {
      const royaltyInfo = await nftLaunchpad.royaltyInfo(1, ethers.parseEther("1"));
      expect(royaltyInfo.receiver).to.equal(owner.address);
      expect(royaltyInfo.royaltyAmount).to.equal(ethers.parseEther("0.05")); // 5%
    });
  });

  describe("Minting", function () {
    it("Should allow public mint with correct payment", async function () {
      const quantity = 2;
      const cost = MINT_PRICE * BigInt(quantity);
      
      await expect(nftLaunchpad.connect(addr1).mint(quantity, { value: cost }))
        .to.emit(nftLaunchpad, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, 1);

      expect(await nftLaunchpad.totalMinted()).to.equal(quantity);
      expect(await nftLaunchpad.walletMintCount(addr1.address)).to.equal(quantity);
    });

    it("Should revert if payment is insufficient", async function () {
      await expect(
        nftLaunchpad.connect(addr1).mint(1, { value: ethers.parseEther("0.005") })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should revert if exceeding max per wallet", async function () {
      const quantity = 6; // MAX_PER_WALLET is 5
      const cost = MINT_PRICE * BigInt(quantity);
      
      await expect(
        nftLaunchpad.connect(addr1).mint(quantity, { value: cost })
      ).to.be.revertedWith("Exceeds max per wallet");
    });

    it("Should revert if exceeding max supply", async function () {
      const quantity = MAX_SUPPLY + 1;
      const cost = MINT_PRICE * BigInt(quantity);
      
      await expect(
        nftLaunchpad.connect(addr1).mint(quantity, { value: cost })
      ).to.be.revertedWith("Exceeds max supply");
    });
  });

  describe("Whitelist Minting", function () {
    it("Should allow whitelist mint with valid proof", async function () {
      // Create a simple merkle tree manually for testing
      const { MerkleTree } = await import("merkletreejs");
      const { keccak256 } = await import("ethereum-cryptography/keccak.js");
      
      const leaves = [keccak256(addr1.address)].map(x => Buffer.from(x.slice(2), 'hex'));
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();
      
      await nftLaunchpad.setMerkleRoot(root);
      
      const proof = tree.getHexProof(leaves[0]);
      const cost = MINT_PRICE;
      
      await expect(nftLaunchpad.connect(addr1).whitelistMint(1, proof, { value: cost }))
        .to.emit(nftLaunchpad, "Transfer");
        
      expect(await nftLaunchpad.whitelistMinted(addr1.address)).to.be.true;
    });

    it("Should revert whitelist mint with invalid proof", async function () {
      const fakeProof = ["0x" + "00".repeat(32)];
      await expect(
        nftLaunchpad.connect(addr1).whitelistMint(1, fakeProof, { value: MINT_PRICE })
      ).to.be.revertedWith("Invalid proof");
    });

    it("Should revert if address already whitelist minted", async function () {
      const { MerkleTree } = await import("merkletreejs");
      const { keccak256 } = await import("ethereum-cryptography/keccak.js");
      
      const leaves = [keccak256(addr1.address)].map(x => Buffer.from(x.slice(2), 'hex'));
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      
      await nftLaunchpad.setMerkleRoot(tree.getHexRoot());
      const proof = tree.getHexProof(leaves[0]);
      
      await nftLaunchpad.connect(addr1).whitelistMint(1, proof, { value: MINT_PRICE });
      
      await expect(
        nftLaunchpad.connect(addr1).whitelistMint(1, proof, { value: MINT_PRICE })
      ).to.be.revertedWith("Already whitelisted");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to set mint price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await nftLaunchpad.setMintPrice(newPrice);
      expect(await nftLaunchpad.mintPrice()).to.equal(newPrice);
    });

    it("Should allow owner to pause and unpause", async function () {
      await nftLaunchpad.pause();
      await expect(nftLaunchpad.connect(addr1).mint(1, { value: MINT_PRICE }))
        .to.be.revertedWithCustomError(nftLaunchpad, "EnforcedPause");
        
      await nftLaunchpad.unpause();
      await expect(nftLaunchpad.connect(addr1).mint(1, { value: MINT_PRICE }))
        .to.not.be.reverted;
    });

    it("Should allow owner to withdraw funds", async function () {
      await nftLaunchpad.connect(addr1).mint(1, { value: MINT_PRICE });
      
      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await nftLaunchpad.getAddress());
      
      const tx = await nftLaunchpad.withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.closeTo(initialBalance + contractBalance - gasUsed, ethers.parseEther("0.001"));
    });

    it("Should allow owner to set base URI and toggle reveal", async function () {
      const newURI = "ipfs://revealed/";
      await nftLaunchpad.setBaseURI(newURI);
      await nftLaunchpad.toggleReveal();
      
      expect(await nftLaunchpad.isRevealed()).to.be.true;
      
      // Mint a token to check URI
      await nftLaunchpad.connect(addr1).mint(1, { value: MINT_PRICE });
      expect(await nftLaunchpad.tokenURI(1)).to.equal("ipfs://revealed/1.json");
    });

    it("Should revert admin functions when called by non-owner", async function () {
      await expect(nftLaunchpad.connect(addr1).setMintPrice(ethers.parseEther("0.02")))
        .to.be.revertedWithCustomError(nftLaunchpad, "OwnableUnauthorizedAccount");
    });
  });
});
