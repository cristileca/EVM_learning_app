import React, { useState, useEffect } from "react";
import axios from "axios";
import { ethers, Wallet } from "ethers";
import WalletConnect from "./components/WalletConnect";
import BalanceChecker from "./components/BalanceChecker";
import TransactionSender from "./components/TransactionSender";
import TransactionHistory from "./components/TransactionHistory";
import WaletConnect from "./components/WalletConnect";
import "./index.css";
import LocalWallet from "./components/LocalWallet";

function App() {
  const backend = "http://localhost:4000";
  const [activeWallet, setActiveWallet] = useState<ethers.Wallet | null>(null);

  const [addr, setAddr] = useState("");
  const [balance, setBalance] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [txResult, setTxResult] = useState<any>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [userTxs, setUserTxs] = useState<any[]>([]);
  const [network, setNetwork] = useState<string>("");

  const getTransactions = async () => {
    if (!userAddress) return;
    const r = await axios.get(`${backend}/txs/${userAddress}`);
    setUserTxs(r.data);
  };

  // Refresh balance automatically
  useEffect(() => {
    if (!walletConnected || !userAddress) return;
    const interval = setInterval(async () => {
      const r = await axios.get(`${backend}/balance/${userAddress}`);
      setBalance(r.data.balance);
    }, 15000);
    return () => clearInterval(interval);
  }, [walletConnected, userAddress]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-gray-900 rounded-2xl shadow">
        <h1 className="text-2xl text-white font-semibold mb-4 text-center">
          🧪 Mini Ethereum Lab
        </h1>

        <LocalWallet backend={backend} setAddr={setAddr} setBalance={setBalance} userAddress={userAddress}/> 

        <WalletConnect
          walletConnected={walletConnected}
          userAddress={userAddress}
          network={network}
          setWalletConnected={setWalletConnected}
          setUserAddress={setUserAddress}
          setNetwork={setNetwork}
          setAddr={setAddr}
          backend={backend}
          setBalance={setBalance}
        />

        <BalanceChecker
          addr={addr}
          setAddr={setAddr}
          balance={balance}
          setBalance={setBalance}
          backend={backend}
        />

        <TransactionSender
          to={to}
          setTo={setTo}
          amount={amount}
          setAmount={setAmount}
          txResult={txResult}
          setTxResult={setTxResult}
          backend={backend}
        />

        <TransactionHistory
          userTxs={userTxs}
          getTransactions={getTransactions}
          walletConnected={walletConnected}
        />
      </div>
    </div>
  );
}

export default App;
