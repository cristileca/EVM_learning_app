import { useState, useEffect } from "react";
import { ethers } from "ethers";

interface LocalWalletProps {
  backend: string;
  setAddr: (addr: string) => void;
  setBalance: (b: string) => void;
  userAddress?: string | null;
}

export default function LocalWallet({
  backend,
  setAddr,
  setBalance,
  userAddress,
}: LocalWalletProps) {
  const [wallet, setWallet] = useState<any>(null);
  const [privateKey, setPrivateKey] = useState("");
  const [status, setStatus] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [sentAmount, setSentAmount] = useState("");

  // Load saved wallet from localStorage
  useEffect(() => {
    const savedPk = localStorage.getItem("localWalletPK");
    if (savedPk) {
      const w = new ethers.Wallet(savedPk);
      setWallet(w);
      setAddr(w.address);
    }
  }, [setAddr]);

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
      if (!privateKey.startsWith("0x"))
        throw new Error("Private key must start with 0x");
      const w = new ethers.Wallet(privateKey);
      setWallet(w);
      setAddr(w.address);
      localStorage.setItem("localWalletPK", w.privateKey);
      setStatus("✅ Wallet imported successfully");
    } catch (err: any) {
      setStatus(`❌ Invalid private key: ${err.message}`);
    }
  };

  // Clear wallet
  const clearWallet = () => {
    localStorage.removeItem("localWalletPK");
    setWallet(null);
    setPrivateKey("");
    setStatus("🗑️ Local wallet removed");
  };

  // Get balance from backend
  const getBalance = async () => {
    if (!wallet) return alert("No wallet available");
    try {
      const res = await fetch(`${backend}/balance/${wallet.address}`);
      const data = await res.json();
      setBalance(data.balance);
    } catch (err: any) {
      setStatus(`❌ Failed to fetch balance: ${err.message}`);
    }
  };

  // Send ETH to any address
  const sendTx = async (to: string, amount: string) => {
    if (!wallet) return alert("No wallet available");
    if (!to || !amount || isNaN(Number(amount)))
      return alert("Please fill all fields with valid values");

    try {
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia.drpc.org"
      );
      const connectedWallet = wallet.connect(provider);

      const tx = await connectedWallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      setStatus(`✅ Transaction sent! Tx Hash: ${tx.hash}`);
      console.log("Transaction sent:", tx.hash);

      await tx.wait();
      setStatus(`✅ Transaction confirmed! Tx Hash: ${tx.hash}`);
      getBalance();
      return { txHash: tx.hash };
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
      return { error: err.message };
    }
  };

  // Send ETH specifically to MetaMask
  const sendToMetaMask = async (amount: string, userAddress: string | null) => {
    if (!wallet) return alert("No local wallet available");
    if (!userAddress) return alert("No MetaMask connected");
    if (!amount || isNaN(Number(amount))) return alert("Enter a valid amount");

    try {
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia.drpc.org"
      );
      const connectedWallet = wallet.connect(provider);

      const tx = await connectedWallet.sendTransaction({
        to: userAddress,
        value: ethers.parseEther(amount),
      });

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      setStatus(`✅ Sent ${amount} ETH to MetaMask! Tx Hash: ${tx.hash}`);
      getBalance();
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    }
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
            className="w-full p-2 border rounded text-xs mb-2"
          />
          <button
            onClick={importWallet}
            className="w-full px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Import Wallet
          </button>
        </>
      ) : (
        <div className="text-gray-200 text-sm">
          <p>
            <strong>Address:</strong> {wallet.address}
          </p>
          <p>
            <strong>Private Key:</strong> {wallet.privateKey.slice(0, 16)}...
          </p>

          <button
            onClick={() => sendToMetaMask(sentAmount, userAddress || null)}
            className="w-full px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 mt-2"
          >
            Send to MetaMask
          </button>

          <div className="mt-4">
            <div className="text-white text-sm mb-2">Send ETH to any address:</div>
            <input
              value={sentTo}
              onChange={(e) => setSentTo(e.target.value)}
              placeholder="Recipient address"
              className="w-full p-2 border text-black rounded text-xs mb-2"
            />
            <input
              value={sentAmount}
              onChange={(e) => setSentAmount(e.target.value)}
              placeholder="Amount in ETH"
              className="w-full p-2 border text-black rounded text-xs mb-2"
            />
            <button
              onClick={() => sendTx(sentTo, sentAmount)}
              className="w-full px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Send ETH
            </button>
          </div>

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
