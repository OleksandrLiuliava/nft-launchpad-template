import { useState } from 'react';
import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { Loader2, AlertTriangle } from 'lucide-react';

interface AdminPageProps {
  account: string | null;
  isOwner: boolean;
  connectWallet: () => Promise<void>;
}

export default function AdminPage({ account, isOwner, connectWallet }: AdminPageProps) {
  const [newPrice, setNewPrice] = useState('');
  const [newBaseUri, setNewBaseUri] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState('');

  if (!account) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
        <p className="text-gray-400 mb-6">Please connect your wallet to access the admin panel.</p>
        <button onClick={connectWallet} className="btn-primary">Connect Wallet</button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertTriangle size={48} className="mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400">Only the contract owner can access this page.</p>
      </div>
    );
  }

  const executeAction = async (fn: () => Promise<any>, actionName: string) => {
    setIsLoading(true);
    setAction(actionName);
    try {
      await fn();
      alert(`${actionName} successful!`);
    } catch (error) {
      console.error(`${actionName} failed:`, error);
      alert(`${actionName} failed. Check console for details.`);
    } finally {
      setIsLoading(false);
      setAction('');
    }
  };

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(
      CONFIG.CONTRACT_ADDRESS,
      [
        'function setMintPrice(uint256 newPrice)',
        'function setBaseURI(string memory newURI)',
        'function toggleReveal()',
        'function pause()',
        'function unpause()',
        'function withdraw()',
      ],
      signer
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <span className="text-sm text-green-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Owner Connected
        </span>
      </div>

      <div className="card space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Mint Configuration</h3>
          <div className="flex gap-4">
            <input
              type="number"
              step="0.001"
              placeholder="New price in ETH"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={() => executeAction(async () => {
                const contract = await getContract();
                const tx = await contract.setMintPrice(ethers.parseEther(newPrice));
                await tx.wait();
              }, 'Set Mint Price')}
              disabled={isLoading || !newPrice}
              className="btn-primary whitespace-nowrap"
            >
              {isLoading && action === 'Set Mint Price' ? <Loader2 className="animate-spin" /> : 'Set Price'}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-lg font-semibold mb-4">Metadata & Reveal</h3>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="ipfs://Qm.../"
              value={newBaseUri}
              onChange={(e) => setNewBaseUri(e.target.value)}
              className="input-field flex-1"
            />
            <button
              onClick={() => executeAction(async () => {
                const contract = await getContract();
                const tx = await contract.setBaseURI(newBaseUri);
                await tx.wait();
              }, 'Set Base URI')}
              disabled={isLoading || !newBaseUri}
              className="btn-primary whitespace-nowrap"
            >
              {isLoading && action === 'Set Base URI' ? <Loader2 className="animate-spin" /> : 'Set URI'}
            </button>
          </div>
          <button
            onClick={() => executeAction(async () => {
              const contract = await getContract();
              const tx = await contract.toggleReveal();
              await tx.wait();
            }, 'Toggle Reveal')}
            disabled={isLoading}
            className="btn-secondary w-full"
          >
            {isLoading && action === 'Toggle Reveal' ? <Loader2 className="animate-spin" /> : 'Toggle Reveal State'}
          </button>
        </div>

        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-lg font-semibold mb-4">Contract Controls</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => executeAction(async () => {
                const contract = await getContract();
                const tx = await contract.pause();
                await tx.wait();
              }, 'Pause')}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              {isLoading && action === 'Pause' ? <Loader2 className="animate-spin" /> : 'Pause Minting'}
            </button>
            <button
              onClick={() => executeAction(async () => {
                const contract = await getContract();
                const tx = await contract.unpause();
                await tx.wait();
              }, 'Unpause')}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all"
            >
              {isLoading && action === 'Unpause' ? <Loader2 className="animate-spin" /> : 'Unpause Minting'}
            </button>
          </div>
          <button
            onClick={() => executeAction(async () => {
              if (!window.confirm('Are you sure you want to withdraw all funds?')) return;
              const contract = await getContract();
              const tx = await contract.withdraw();
              await tx.wait();
            }, 'Withdraw')}
            disabled={isLoading}
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            {isLoading && action === 'Withdraw' ? <Loader2 className="animate-spin" /> : 'Withdraw All ETH'}
          </button>
        </div>
      </div>
    </div>
  );
}
