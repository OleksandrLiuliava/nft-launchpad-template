// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title NFTLaunchpad
 * @dev A configurable ERC-721 NFT launchpad with whitelist, reveal mechanics, and EIP-2981 royalties.
 * Designed for easy customization and testnet deployment.
 */
contract NFTLaunchpad is ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981, Ownable, Pausable {
    // ==========================================
    // CONFIGURABLE VARIABLES (Change these via constructor or admin functions)
    // ==========================================
    
    /// @dev Maximum number of NFTs that can be minted
    uint256 public immutable MAX_SUPPLY;
    
    /// @dev Maximum number of NFTs a single wallet can mint
    uint256 public maxPerWallet;
    
    /// @dev Price to mint a single NFT (in Wei)
    uint256 public mintPrice;
    
    /// @dev Base URI for metadata (e.g., ipfs://Qm.../)
    string private _baseTokenURI;
    
    /// @dev Flag to toggle between hidden and revealed metadata
    bool public isRevealed;
    
    /// @dev Hidden URI shown before reveal
    string public hiddenURI;

    // ==========================================
    // STATE VARIABLES
    // ==========================================
    
    /// @dev Merkle root for whitelist validation
    bytes32 public merkleRoot;
    
    /// @dev Mapping to track if an address has used its whitelist spot
    mapping(address => bool) public whitelistMinted;
    
    /// @dev Mapping to track total mints per wallet
    mapping(address => uint256) public walletMintCount;
    
    /// @dev Counter for total minted NFTs
    uint256 private _totalMinted;

    // ==========================================
    // EVENTS
    // ==========================================
    
    event MintPriceUpdated(uint256 newPrice);
    event MaxPerWalletUpdated(uint256 newMax);
    event BaseURISet(string newURI);
    event RevealToggled(bool isRevealed);
    event MerkleRootSet(bytes32 newRoot);
    event Withdrawal(address indexed owner, uint256 amount);

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
    
    /**
     * @dev Initializes the contract with configurable parameters.
     * @param name_ ERC721 name
     * @param symbol_ ERC721 symbol
     * @param maxSupply_ Maximum supply of NFTs
     * @param maxPerWallet_ Maximum mints per wallet
     * @param mintPrice_ Price per mint in Wei
     * @param royaltyReceiver_ Address to receive royalties
     * @param royaltyFeeNumerator_ Royalty fee numerator (e.g., 500 = 5%)
     * @param hiddenURI_ URI to show before reveal
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 maxPerWallet_,
        uint256 mintPrice_,
        address royaltyReceiver_,
        uint96 royaltyFeeNumerator_,
        string memory hiddenURI_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        require(maxSupply_ > 0, "Max supply must be > 0");
        require(royaltyFeeNumerator_ <= 10000, "Royalty fee too high");
        
        MAX_SUPPLY = maxSupply_;
        maxPerWallet = maxPerWallet_;
        mintPrice = mintPrice_;
        hiddenURI = hiddenURI_;
        
        // Set default royalty to 5% (500 / 10000)
        _setDefaultRoyalty(royaltyReceiver_, royaltyFeeNumerator_);
    }

    // ==========================================
    // MINTING LOGIC
    // ==========================================
    
    /**
     * @dev Public mint function.
     * @param quantity Number of NFTs to mint
     */
    function mint(uint256 quantity) external payable whenNotPaused {
        require(quantity > 0, "Quantity must be > 0");
        require(_totalMinted + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(walletMintCount[msg.sender] + quantity <= maxPerWallet, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        
        _mintTokens(msg.sender, quantity);
    }

    /**
     * @dev Whitelist mint function.
     * @param quantity Number of NFTs to mint
     * @param proof Merkle proof for whitelist validation
     */
    function whitelistMint(uint256 quantity, bytes32[] calldata proof) external payable whenNotPaused {
        require(quantity > 0, "Quantity must be > 0");
        require(!whitelistMinted[msg.sender], "Already whitelisted");
        require(_totalMinted + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(walletMintCount[msg.sender] + quantity <= maxPerWallet, "Exceeds max per wallet");
        require(msg.value >= mintPrice * quantity, "Insufficient payment");
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
        
        whitelistMinted[msg.sender] = true;
        _mintTokens(msg.sender, quantity);
    }

    /**
     * @dev Internal function to handle token minting.
     */
    function _mintTokens(address to, uint256 quantity) internal {
        for (uint256 i = 0; i < quantity; i++) {
            _totalMinted++;
            walletMintCount[to]++;
            _safeMint(to, _totalMinted);
        }
    }

    // ==========================================
    // METADATA & URI
    // ==========================================
    
    /**
     * @dev Returns the token URI. Shows hidden URI if not revealed.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        _requireOwned(tokenId);
        
        if (!isRevealed) {
            return hiddenURI;
        }
        
        string memory baseURI = _baseURI();
        if (bytes(baseURI).length > 0) {
            return string(abi.encodePacked(baseURI, Strings.toString(tokenId), ".json"));
        }
        
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Internal function to return base URI.
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Returns true if contract supports an interface.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    // ==========================================
    // ADMIN FUNCTIONS
    // ==========================================
    
    /**
     * @dev Sets the mint price.
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    /**
     * @dev Sets the max mints per wallet.
     */
    function setMaxPerWallet(uint256 newMax) external onlyOwner {
        maxPerWallet = newMax;
        emit MaxPerWalletUpdated(newMax);
    }

    /**
     * @dev Sets the merkle root for whitelist.
     */
    function setMerkleRoot(bytes32 newRoot) external onlyOwner {
        merkleRoot = newRoot;
        emit MerkleRootSet(newRoot);
    }

    /**
     * @dev Sets the base URI for metadata.
     */
    function setBaseURI(string memory newURI) external onlyOwner {
        _baseTokenURI = newURI;
        emit BaseURISet(newURI);
    }

    /**
     * @dev Toggles the reveal state.
     */
    function toggleReveal() external onlyOwner {
        isRevealed = !isRevealed;
        emit RevealToggled(isRevealed);
    }

    /**
     * @dev Pauses all minting.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses minting.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Withdraws all ETH from the contract to the owner.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit Withdrawal(owner(), balance);
    }

    // ==========================================
    // VIEW FUNCTIONS
    // ==========================================
    
    /**
     * @dev Returns the total number of minted NFTs.
     */
    function totalMinted() public view returns (uint256) {
        return _totalMinted;
    }

    /**
     * @dev Returns the number of available NFTs.
     */
    function availableSupply() public view returns (uint256) {
        return MAX_SUPPLY - _totalMinted;
    }
}
