import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Wallet, LayoutGrid, Shield } from 'lucide-react';
import MintPage from './pages/MintPage';
import AdminPage from './pages/AdminPage';
import GalleryPage from './pages/GalleryPage';
import { CONFIG } from './config';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        
        if (CONFIG.OWNER_ADDRESS && accounts[0].toLowerCase() === CONFIG.OWNER_ADDRESS.toLowerCase()) {
          setIsOwner(true);
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        setAccount(accounts[0] || null);
        setIsOwner(accounts[0]?.toLowerCase() === CONFIG.OWNER_ADDRESS?.toLowerCase() || false);
      });
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-darker text-white">
        <nav className="border-b border-gray-800 bg-dark/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {CONFIG.COLLECTION_NAME}
                </Link>
                <div className="hidden md:flex space-x-4">
                  <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                    <LayoutGrid size={16} /> Mint
                  </Link>
                  <Link to="/gallery" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                    <LayoutGrid size={16} /> My NFTs
                  </Link>
                  {isOwner && (
                    <Link to="/admin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2">
                      <Shield size={16} /> Admin
                    </Link>
                  )}
                </div>
              </div>
              <button
                onClick={connectWallet}
                className="btn-primary flex items-center gap-2"
              >
                <Wallet size={18} />
                {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connect Wallet'}
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<MintPage account={account} connectWallet={connectWallet} />} />
            <Route path="/gallery" element={<GalleryPage account={account} connectWallet={connectWallet} />} />
            <Route path="/admin" element={<AdminPage account={account} isOwner={isOwner} connectWallet={connectWallet} />} />
          </Routes>
        </main>

        <footer className="border-t border-gray-800 mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
            <p>NFT Launchpad Template • Built with Hardhat, React & TailwindCSS</p>
            <p className="mt-2">Deployed on {CONFIG.CHAIN_NAME} Testnet</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

declare global {
  interface Window {
    ethereum?: any;
  }
}
