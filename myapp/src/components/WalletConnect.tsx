import { useEffect } from "react";
import { ethers } from "ethers";

interface WalletConnectProps {
  walletConnected: boolean;
  userAddress: string | null;
  network: string;
  setWalletConnected: (connected: boolean) => void;
  setUserAddress: (addr: string | null) => void;
  setNetwork: (net: string) => void;
  setAddr: (addr: string) => void;
  backend: string;
  setBalance: (b: string) => void;
}

export default function WalletConnect({
  walletConnected,
  userAddress,
  network,
  setWalletConnected,
  setUserAddress,
  setNetwork,
  setAddr,
  backend,
  setBalance
}: WalletConnectProps) {
  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) return alert("Please install MetaMask");

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const networkInfo = await provider.getNetwork();

      setUserAddress(address);
      setWalletConnected(true);
      setAddr(address);
      setNetwork(`${networkInfo.name} (Chain ID: ${networkInfo.chainId})`);

      // persist connection
      localStorage.setItem("walletAddress", address);

      const r = await fetch(`${backend}/balance/${address}`);
      const data = await r.json();
      setBalance(data.balance);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet");
    }
  };

  // Auto-reconnect on page load
  useEffect(() => {
    const saved = localStorage.getItem("walletAddress");
    if (saved) {
      setWalletConnected(true);
      setUserAddress(saved);
      setAddr(saved);
    }
  }, []);

  return (
    <div className="mb-4">
      {!walletConnected ? (
        <button
          onClick={connectWallet}
          className="w-full px-3 py-2 rounded bg-yellow-600 text-white font-medium hover:bg-yellow-700"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="text-sm text-white">
          <div><strong>Wallet:</strong> {userAddress?.slice(0, 8)}...{userAddress?.slice(-6)}</div>
          <div><strong>Network:</strong> {network}</div>
        </div>
      )}
    </div>
  );
}
