import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { ExternalLink, Loader2, ImageOff } from 'lucide-react';

interface GalleryPageProps {
  account: string | null;
  connectWallet: () => Promise<void>;
}

interface NFT {
  tokenId: string;
  image: string;
  name: string;
}

export default function GalleryPage({ account, connectWallet }: GalleryPageProps) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (account) {
      fetchNFTs();
    }
  }, [account]);

  const fetchNFTs = async () => {
    if (!account || typeof window.ethereum === 'undefined') return;
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        [
          'function balanceOf(address owner) view returns (uint256)',
          'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
          'function tokenURI(uint256 tokenId) view returns (string)',
        ],
        provider
      );

      const balance = await contract.balanceOf(account);
      const ownedNfts: NFT[] = [];

      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(account, i);
        const uri = await contract.tokenURI(tokenId);
        
        let name = `NFT #${tokenId}`;
        let image = '/placeholder-nft.png';

        if (uri && !uri.includes('hidden')) {
          try {
            const ipfsHash = uri.replace('ipfs://', 'https://ipfs.io/ipfs/');
            const response = await fetch(ipfsHash);
            const metadata = await response.json();
            name = metadata.name || name;
            image = metadata.image ? metadata.image.replace('ipfs://', 'https://ipfs.io/ipfs/') : image;
          } catch (e) {
            console.error('Failed to fetch metadata for token', tokenId, e);
          }
        }

        ownedNfts.push({ tokenId: tokenId.toString(), image, name });
      }

      setNfts(ownedNfts);
    } catch (error) {
      console.error('Failed to fetch NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">My NFT Gallery</h2>
        <p className="text-gray-400 mb-6">Connect your wallet to view your NFTs.</p>
        <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My NFTs</h1>
        <button onClick={fetchNFTs} className="btn-secondary flex items-center gap-2">
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : nfts.length === 0 ? (
        <div className="card text-center py-16">
          <ImageOff size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
          <p className="text-gray-400 mb-6">You don't own any NFTs from this collection yet.</p>
          <a href="/" className="btn-primary inline-block">Go to Mint Page</a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <div key={nft.tokenId} className="card overflow-hidden hover:border-primary/50 transition-all duration-300 group">
              <div className="aspect-square bg-gray-800 relative overflow-hidden">
                <img 
                  src={nft.image} 
                  alt={nft.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold truncate">{nft.name}</h3>
                <p className="text-sm text-gray-400 mb-3">Token ID: {nft.tokenId}</p>
                <a
                  href={`${CONFIG.OPENSEA_BASE_URL}${CONFIG.CONTRACT_ADDRESS}/${nft.tokenId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full btn-secondary text-sm"
                >
                  View on OpenSea <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
