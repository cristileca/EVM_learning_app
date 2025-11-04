import dotenv from "dotenv";
dotenv.config(); // Load .env

import express, { Request, Response } from "express";
import cors from "cors";
import { ethers } from "ethers";
import axios from "axios";

console.log("🚀 Starting server...");

// --- Config ---
const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: "http://localhost:3000", // React dev server
  methods: ["GET", "POST"]
}));
app.use(express.json());

// --- Ethereum Setup ---
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!RPC_URL || !PRIVATE_KEY) {
  console.error("❌ RPC_URL or PRIVATE_KEY missing in .env");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// --- Routes ---

// Test route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

// 1️⃣ Get balance of an address
app.get("/balance/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const balance = await provider.getBalance(address);
    res.json({ balance: ethers.formatEther(balance) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Send ETH from PRIVATE_KEY wallet
app.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, amountEther } = req.body;
    if (!to || !amountEther) throw new Error("Missing 'to' or 'amountEther'");

    const tx = await signer.sendTransaction({
      to,
      value: ethers.parseEther(amountEther)
    });

    await tx.wait();
    res.json({ txHash: tx.hash });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get recent transactions (Etherscan API v2)
app.get("/txs/:address", async (req, res) => {
  try {
    const { address } = req.params;
    const r = await axios.get("https://api.etherscan.io/v2/api", {
      params: {
        chainid: process.env.CHAIN_ID,         // Sepolia = 11155111
        module: "account",
        action: "txlist",
        address,
        startblock: 0,
        endblock: 99999999,
        sort: "desc",
        apikey: process.env.ETHERSCAN_API_KEY,
      },
    });

    if (r.data.status === "0") {
      return res.status(400).json({ error: r.data.result });
    }

    res.json(r.data.result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Start server ---
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
