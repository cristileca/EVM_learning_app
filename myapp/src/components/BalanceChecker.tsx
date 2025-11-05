import { ethers } from "ethers";

interface BalanceCheckerProps {
  addr: string;
  setAddr: (addr: string) => void;
  balance: string | null;
  setBalance: (b: string | null) => void;
  backend: string;
}

export default function BalanceChecker({ addr, setAddr, balance, setBalance, backend }: BalanceCheckerProps) {
  const getBalance = async () => {
    if (!addr) return alert("Please enter an address");
    const r = await fetch(`${backend}/balance/${addr}`);
    const data = await r.json();
    setBalance(data.balance);
  };

  return (
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
  );
}
