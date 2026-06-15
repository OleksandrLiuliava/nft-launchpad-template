import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { CheckCircle, XCircle, ExternalLink, Loader2 } from 'lucide-react';

interface MintPageProps {
  account: string | null;
  connectWallet: () => Promise<void>;
}

export default function MintPage({ account, connectWallet }: MintPageProps) {
  const [quantity, setQuantity] = useState(1);
  const [totalMinted, setTotalMinted] = useState(0);
  const [maxSupply, setMaxSupply] = useState(1000);
  const [mintPrice, setMintPrice] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [wlAddress, setWlAddress] = useState('');
  const [wlStatus, setWlStatus] = useState<'idle' | 'loading' | 'whitelisted' | 'not-whitelisted'>('idle');

  useEffect(() => {
    fetchContractData();
  }, []);

  const fetchContractData = async () => {
    if (typeof window.ethereum === 'undefined') return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        [
          'function totalMinted() view returns (uint256)',
          'function MAX_SUPPLY() view returns (uint256)',
          'function mintPrice() view returns (uint256)',
        ],
        provider
      );

      const minted = await contract.totalMinted();
      const supply = await contract.MAX_SUPPLY();
      const price = await contract.mintPrice();

      setTotalMinted(Number(minted));
      setMaxSupply(Number(supply));
      setMintPrice(ethers.formatEther(price));
    } catch (error) {
      console.error('Failed to fetch contract data:', error);
    }
  };

  const handleMint = async () => {
    if (!account) {
      connectWallet();
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONFIG.CONTRACT_ADDRESS,
        ['function mint(uint256 quantity) payable'],
        signer
      );

      const totalCost = ethers.parseEther((Number(mintPrice) * quantity).toString());
      const tx = await contract.mint(quantity, { value: totalCost });
      setTxHash(tx.hash);
      await tx.wait();
      
      fetchContractData();
    } catch (error) {
      console.error('Mint failed:', error);
      alert('Mint failed. Please check your wallet and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWhitelist = async () => {
    if (!wlAddress) return;
    setWlStatus('loading');
    // Note: Actual whitelist checking requires the merkle proof. 
    // This is a simplified UI demo. In production, you'd verify against your backend or merkle tree.
    setTimeout(() => {
      setWlStatus(wlAddress.toLowerCase() === account?.toLowerCase() ? 'whitelisted' : 'not-whitelisted');
    }, 1000);
  };

  const progress = (totalMinted / maxSupply) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="card">
          <div className="aspect-square bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center mb-6">
            <span className="text-6xl">🎨</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{CONFIG.COLLECTION_NAME}</h1>
          <p className="text-gray-400 mb-4">{CONFIG.COLLECTION_DESCRIPTION}</p>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Minted</span>
              <span className="font-semibold">{totalMinted} / {maxSupply}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg mb-6">
            <span className="text-gray-400">Price</span>
            <span className="text-2xl font-bold">{mintPrice} ETH</span>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-12 h-12 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-xl font-bold"
            >
              -
            </button>
            <span className="text-2xl font-bold w-12 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(CONFIG.MAX_PER_WALLET, quantity + 1))}
              className="w-12 h-12 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-xl font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={handleMint}
            disabled={isLoading || totalMinted >= maxSupply}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <><Loader2 className="animate-spin" /> Processing...</>
            ) : totalMinted >= maxSupply ? (
              'Sold Out'
            ) : !account ? (
              'Connect Wallet to Mint'
            ) : (
              `Mint ${quantity} NFT${quantity > 1 ? 's' : ''}`
            )}
          </button>

          {txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 text-primary hover:text-primary/80 text-sm"
            >
              View on Etherscan <ExternalLink size={14} />
            </a>
          )}
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle size={20} className="text-primary" />
              Whitelist Checker
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter wallet address"
                value={wlAddress}
                onChange={(e) => setWlAddress(e.target.value)}
                className="input-field flex-1"
              />
              <button onClick={checkWhitelist} className="btn-secondary" disabled={wlStatus === 'loading'}>
                {wlStatus === 'loading' ? <Loader2 className="animate-spin" size={20} /> : 'Check'}
              </button>
            </div>
            {wlStatus === 'whitelisted' && (
              <p className="mt-3 text-green-400 flex items-center gap-2">
                <CheckCircle size={16} /> Address is whitelisted!
              </p>
            )}
            {wlStatus === 'not-whitelisted' && (
              <p className="mt-3 text-red-400 flex items-center gap-2">
                <XCircle size={16} /> Address is not whitelisted.
              </p>
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-4">How to Mint</h3>
            <ol className="space-y-3 text-gray-400 text-sm list-decimal list-inside">
              <li>Install <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">MetaMask</a></li>
              <li>Add <a href="https://chainlist.org/chain/11155111" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Sepolia Testnet</a> to your wallet</li>
              <li>Get free Sepolia ETH from <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sepoliafaucet.com</a></li>
              <li>Connect your wallet and click Mint!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
