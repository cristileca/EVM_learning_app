import { useState, useEffect } from "react";
import { ethers , Wallet} from "ethers";

interface LocalWalletProps {
  backend: string;
  setAddr: (addr: string) => void;
  setBalance: (b: string) => void;
}

export default function LocalWallet({ backend, setAddr, setBalance }: LocalWalletProps) {
  const [wallet, setWallet] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState("");
  const [status, setStatus] = useState("");

  // Load saved wallet from localStorage
  useEffect(() => {
    const savedPk = localStorage.getItem("localWalletPK");
    if (savedPk) {
      const w = new ethers.Wallet(savedPk);
      setWallet(w);
      setAddr(w.address);
    }
  }, []);

  // Generate new wallet
  const generateWallet = async () => {
    const w = ethers.Wallet.createRandom();
    setWallet(w);
    setAddr(w.address);
    localStorage.setItem("localWalletPK", w.privateKey);
    setStatus("✅ New wallet created & saved to localStorage");
  };



  // Import existing wallet
  const importWallet = async () => {
    try {
      if (!privateKey.startsWith("0x")) throw new Error("Private key must start with 0x");
      const w = new ethers.Wallet(privateKey);
      setWallet(w);
      setAddr(w.address);
      localStorage.setItem("localWalletPK", w.privateKey);
      setStatus("✅ Wallet imported successfully");
    } catch (err: any) {
      setStatus(`❌ Invalid private key: ${err.message}`);
    }
  };

  // Get balance
  const getBalance = async () => {
    if (!wallet) return alert("No wallet available");
    const res = await fetch(`${backend}/balance/${wallet.address}`);
    const data = await res.json();
    setBalance(data.balance);
  };

  // Clear wallet
  const clearWallet = () => {
    localStorage.removeItem("localWalletPK");
    setWallet(null);
    setPrivateKey("");
    setStatus("🗑️ Local wallet removed");
  };

  return (
    <div className="mb-6 p-4 bg-gray-800 rounded-lg">
      <h2 className="text-xl text-white font-semibold mb-3">🔐 Local Wallet</h2>

      {!wallet ? (
        <>
          <button
            onClick={generateWallet}
            className="mb-3 w-full px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Generate New Wallet
          </button>

          <div className="text-white text-sm mb-2">or import one:</div>
          <input
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="0x... private key"
            className="w-full p-2 border rounded text-xs"
          />
          <button
            onClick={importWallet}
            className="mt-2 w-full px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Import Wallet
          </button>
        </>
      ) : (
        <div className="text-gray-200 text-sm">
          <p><strong>Address:</strong> {wallet.address}</p>
            <p>
            <strong>Private Key:</strong>{" "}
            <button
              onClick={async () => {
              try {
                await navigator.clipboard.writeText(wallet.privateKey);
                setStatus("📋 Private key copied to clipboard");
              } catch {
                setStatus("❌ Failed to copy private key");
              }
              }}
              className="text-red-500 underline hover:opacity-80 text-xs"
              title="Click to copy full private key"
            >
              {wallet.privateKey.slice(0, 16)}...
            </button>
            </p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={getBalance}
              className="flex-1 px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Get Balance
            </button>
            <button
              onClick={clearWallet}
              className="flex-1 px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {status && <div className="mt-3 text-xs text-gray-400">{status}</div>}
    </div>
  );
}
