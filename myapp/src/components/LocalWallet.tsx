import { useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";


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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTx, setActiveTx] = useState<any>(null);
  const [coins, setCoins] = useState<any[]>([]);
  const [tokensFromWallet, setTokensFromWallet] = useState<any[]>([]);


  const etherscanApiKey = process.env.REACT_APP_ETHERSCAN_API_KEY;
  const etherscanApiUrl = "https://api-sepolia.etherscan.io/api";


  // Load saved wallet from localStorage
  useEffect(() => {
    const savedPk = localStorage.getItem("localWalletPK");
    if (savedPk) {
      const w = new ethers.Wallet(savedPk);
      setWallet(w);
      setAddr(w.address);
      getTokensFromWallet(w.address).then(setTokensFromWallet);
    }
    fetchCoins();

  }, [setAddr]);

  // Generate new wallet
  const generateWallet = async () => {
    const w = ethers.Wallet.createRandom();
    setWallet(w);
    setAddr(w.address);
    localStorage.setItem("localWalletPK", w.privateKey);
    setStatus("✅ New wallet created & saved to localStorage");
  };

const fetchCoins = async () => {
  try {
    const r = await axios.get(`${backend}/api/coins`);

    // Filter only Ethereum-based tokens
    const ethCoins = r.data.data.filter(
      (coin: any) => coin.platform && coin.platform.name === "Ethereum"
    );

    // Find Ethereum’s actual price (to reuse for Sepolia)
    const ethMainnet = r.data.data.find((coin: any) => coin.symbol === "ETH");
    const ethPrice = ethMainnet ? ethMainnet.quote.USD.price : 0;

    // Add a custom Sepolia testnet coin
    const sepoliaCoin = {
      id: "sepolia-eth",
      name: "Sepolia Testnet ETH",
      symbol: "SEP-ETH",
      price_source: "mirrors Ethereum price",
      quote: {
        USD: {
          price: ethPrice,
        },
      },
      platform: { name: "Sepolia Testnet" },
      image:
        "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", // or your own icon
    };

    // Merge Sepolia with ETH coins
    setCoins([sepoliaCoin, ...ethCoins]);
  } catch (err: any) {
    console.error("Failed to fetch coins:", err);
  }
};

  const getTokensFromWallet = async (address: string) => {
    try {
      const url = `${etherscanApiUrl}?module=account&action=tokentx&address=${address}&sort=asc&apikey=${etherscanApiKey}`;
      const r = await axios.get(url);
      const txs = r.data.result;

      if (!txs || txs.length === 0) {
        console.log("No tokens found for this address.");
        return [];
      }

      // Group by token address and calculate approximate balance
      const tokenMap: Record<string, any> = {};
      console.log("Token transactions:", txs);

      txs.forEach((tx: any) => {
        const tokenAddress = tx.contractAddress.toLowerCase();
        const decimals = parseInt(tx.tokenDecimal) || 18;
        const value = Number(tx.value) / 10 ** decimals;

        if (!tokenMap[tokenAddress]) {
          tokenMap[tokenAddress] = {
            name: tx.tokenName,
            symbol: tx.tokenSymbol,
            decimals,
            contract: tokenAddress,
            balance: 0,
          };
        }

        if (tx.to.toLowerCase() === address.toLowerCase()) {
          tokenMap[tokenAddress].balance += value;
        } else if (tx.from.toLowerCase() === address.toLowerCase()) {
          tokenMap[tokenAddress].balance -= value;
        }
      });

      const tokens = Object.values(tokenMap).filter((t: any) => t.balance > 0);

      console.log("Tokens found:", tokens);
      return tokens;
    } catch (error) {
      console.error("Error fetching token data:", error);
      return [];
    }
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
      console.log("Balance data:", data, wallet);
      setBalance(data.balance);
    } catch (err: any) {
      setStatus(`❌ Failed to fetch balance: ${err.message}`);
    }
  };

const getTransactions = async () => {
  if (!wallet) return alert("No wallet available");

  try {
    const res = await fetch(`${backend}/txs/${wallet.address}`);
    const data = await res.json();

    if (Array.isArray(data)) {
      setTransactions(data);
      setStatus(`✅ Loaded ${data.length} transactions`);
    } else if (data.error) {
      setStatus(`⚠️ ${data.error}`);
    } else {
      setStatus("⚠️ Unexpected response from backend");
    }
  } catch (err: any) {
    console.error(err);
    setStatus(`❌ Failed to fetch transactions: ${err.message}`);
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
        gas: 21000,
        maxFeePerGas: ethers.parseUnits("10", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
      });

      setStatus(`✅ Transaction sent! Tx Hash: ${tx.hash}`);
      console.log("Transaction sent:", tx.hash);
      console.log("Transaction confirmed:", tx);
      setActiveTx(tx.nonce)


      const receipt = await tx.wait();
      console.log(receipt);
      setStatus(`✅ Transaction confirmed! Tx Hash: ${tx.hash}`);
      getBalance();
      return { txHash: tx.hash };
    } catch (err: any) {
      console.log(err);
      setStatus(`❌ Error: ${err.message}`);
      return { error: err.message };
    }
  };

  const cancelTx = async (nonce: string) => {
    if (!wallet) return alert("No wallet available");

    try {
      const provider = new ethers.JsonRpcProvider(
        "https://sepolia.drpc.org"
      );
      const connectedWallet = wallet.connect(provider);

      // Send transaction to same address with higher gas price
      const tx = await connectedWallet.sendTransaction({
        to: wallet.address, // Send to self
        value: 0, // 0 ETH
        nonce: nonce, // Same nonce as transaction to cancel
        gasLimit: 21000,
        maxFeePerGas: ethers.parseUnits("20", "gwei"), // Higher gas price
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei") // Higher priority fee
      });

      setStatus(`🔄 Cancellation transaction sent! Tx Hash: ${tx.hash}`);
      console.log("Cancellation transaction sent:", tx.hash);

      const receipt = await tx.wait();
      console.log("Cancellation confirmed:", receipt);
      setStatus(`✅ Transaction cancelled! New Tx Hash: ${tx.hash}`);
      getBalance();
      return { txHash: tx.hash };
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error cancelling transaction: ${err.message}`);
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
            <strong>Private Key:</strong> {wallet.privateKey}...
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
            <button
              onClick={() => cancelTx(activeTx)}
              className="w-full px-3 py-1 rounded bg-red-700 text-white hover:bg-green-700"
            >
              Cancel Transaction
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

      <div className="mt-3">
      <button
        onClick={getTransactions}
        className="w-full px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
      >
        Get Transactions
      </button>

      {transactions.length > 0 && (
        <div className="mt-3 bg-gray-900 p-2 rounded text-xs text-white max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-2">Recent Transactions:</h3>
          {transactions.map((tx) => (
            <div key={tx.hash} className="border-b border-gray-700 pb-1 mb-1">
              <div><strong>Hash:</strong> {tx.hash.slice(0, 20)}...</div>
              <div><strong>To:</strong> {tx.to}</div>
              <div><strong>Value:</strong> {ethers.formatEther(tx.value)} ETH</div>
              <div><strong>Status:</strong> {tx.isError === "0" ? "✅ Success" : "❌ Failed"}</div>
              <div><strong>Block:</strong> {tx.blockNumber}</div>
              <div><strong>Timestamp:</strong> {new Date(parseInt(tx.timeStamp) * 1000).toLocaleString()}</div>
              <div><strong>From-Address</strong> {tx.from}</div>
              <div><strong>To-Address</strong> {tx.to}</div>
            </div>
          ))}
        </div>
      )}
    </div>

   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
    {coins.map((coin) => (
      <div
        key={coin.id}
        className="bg-gray-700 p-3 rounded-lg text-center text-white"
      >
        <img
          src={
            coin.image ||
            `https://s2.coinmarketcap.com/static/img/coins/64x64/${coin.id}.png`
          }
          alt={coin.name}
          className="w-12 h-12 mb-2 mx-auto"
        />
        <div className="font-semibold">{coin.name}</div>
        <div className="text-sm text-gray-300">{coin.symbol}</div>
        <div className="text-sm mt-1">${coin.quote.USD.price.toFixed(2)}</div>
        {coin.platform?.name === "Sepolia Testnet" && (
          <div className="text-xs mt-1 text-yellow-400">(Testnet)</div>
        )}
      </div>
    ))}
  </div>


    </div>
  );
}
