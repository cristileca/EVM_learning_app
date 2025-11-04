import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers } from "ethers";
import "./index.css";

function App() {
  const backend = "http://localhost:4000";

  const [addr, setAddr] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [txResult, setTxResult] = useState<any>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userTxs, setUserTxs] = useState<any[]>([]);
  const [network, setNetwork] = useState<string>("");

  // --- Connect MetaMask ---
  const connectWallet = async () => {
    try {
      if (!(window as any).ethereum) {
        alert("Please install MetaMask!");
        return;
      }

      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const networkInfo = await provider.getNetwork();

      setUserAddress(address);
      setWalletConnected(true);
      setAddr(address);
      setNetwork(`${networkInfo.name} (Chain ID: ${networkInfo.chainId})`);

      // fetch initial balance
      const r = await axios.get(`${backend}/balance/${address}`);
      setBalance(r.data.balance);
    } catch (err) {
      console.error(err);
      alert("Failed to connect wallet");
    }
  };

  // --- Get Balance via backend ---
  const getBalance = async () => {
    if (!addr) return alert("Please enter an address");
    const r = await axios.get(`${backend}/balance/${addr}`);
    setBalance(r.data.balance);
  };

  // --- Send ETH ---
  const send = async () => {
    if (!to || !amount) return alert("Missing fields");
    const r = await axios.post(`${backend}/send`, { to, amountEther: amount });
    setTxResult(r.data);
  };

  // --- Fetch Transactions ---
  const getTransactions = async () => {
    if (!userAddress) return;
    try {
      const r = await axios.get(`${backend}/txs/${userAddress}`);
      setUserTxs(r.data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch transactions");
    }
  };

  // Auto-refresh balance every 15s when connected
  useEffect(() => {
    if (!walletConnected || !userAddress) return;
    const interval = setInterval(getBalance, 15000);
    return () => clearInterval(interval);
  }, [walletConnected, userAddress]);

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-2xl shadow">
        <h1 className="text-2xl text-white font-semibold mb-4 text-center">🧪 Mini Ethereum Lab</h1>

        {!walletConnected ? (
          <button
            onClick={connectWallet}
            className="mb-4 w-full px-3 py-2 rounded bg-yellow-600 text-white font-medium hover:bg-yellow-600"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="mb-4 text-sm text-gray-700">
            <div className="text-white"><strong>Wallet:</strong> {userAddress?.slice(0, 8)}...{userAddress?.slice(-6)}</div>
            <div className="text-white"><strong>Network:</strong> {network}</div>
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-white font-medium mb-1">Address</label>
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="wallet public key"
            className="w-full p-2 border rounded"
          />
          <button
            onClick={getBalance}
            className="mt-2 px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Get Balance
          </button>
          {balance && (
            <div className="mt-2 text-white font-medium">
              Balance: <span className="text-green-600">{balance} ETH</span>
            </div>
          )}
        </div>

        <hr className="my-4" />

        <div>
          <label className="block text-sm text-white font-medium">To</label>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <label className="block text-sm text-white font-medium mt-2">Amount (ETH)</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
          />
          <button
            onClick={send}
            className="mt-2 px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Send
          </button>
          {txResult && (
            <div className="mt-2 text-xs text-gray-600 break-words">
              <strong>Tx Hash:</strong> {txResult.txHash}
            </div>
          )}
        </div>

        {walletConnected && (
            <>
            <hr className="my-4 border-gray-700" />
            <button
              onClick={getTransactions}
              className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-medium 
                   hover:bg-purple-700 transition-colors duration-200"
            >
              📜 View Transaction History
            </button>

            {userTxs.length > 0 && (
              <div className="mt-4 max-h-80 overflow-auto text-sm border border-gray-700 
                    rounded-lg p-4 bg-gray-800 text-gray-300">
              {userTxs.slice(0, 10).map((tx, i) => (
                <div key={i} className="border-b border-gray-700 py-3 last:border-b-0">
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-gray-400">Hash:</span>
                  <span className="font-mono">{tx.hash.slice(0, 20)}...</span>
                  
                  <span className="text-gray-400">From:</span>
                  <span className="font-mono">{tx.from.slice(0, 10)}...</span>
                  
                  <span className="text-gray-400">To:</span>
                  <span className="font-mono">{tx.to ? tx.to.slice(0, 10) : "Contract"}...</span>
                  
                  <span className="text-gray-400">Value:</span>
                  <span className="text-green-400 font-medium">
                  {ethers.formatEther(tx.value)} ETH
                  </span>
                  
                  <span className="text-gray-400">Status:</span>
                  <span className={tx.isError === "0" ? "text-green-400" : "text-red-400"}>
                  {tx.isError === "0" ? "✅ Success" : "❌ Failed"}
                  </span>
                </div>
                </div>
              ))}
              </div>
            )}
            </>
        )}
      </div>
    </div>
  );
}

export default App;
