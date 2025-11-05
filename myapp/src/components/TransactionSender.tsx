interface TransactionSenderProps {
  to: string;
  setTo: (t: string) => void;
  amount: string;
  setAmount: (a: string) => void;
  txResult: any;
  setTxResult: (r: any) => void;
  backend: string;
}

export default function TransactionSender({
  to,
  setTo,
  amount,
  setAmount,
  txResult,
  setTxResult,
  backend
}: TransactionSenderProps) {
  const send = async () => {
    if (!to || !amount) return alert("Missing fields");
    const r = await fetch(`${backend}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, amountEther: amount }),
    });
    const data = await r.json();
    setTxResult(data);
  };

  return (
    <div className="mt-4">
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
        <div className="mt-2 text-xs text-gray-400 break-words">
          <strong>Tx Hash:</strong> {txResult.txHash}
        </div>
      )}
    </div>
  );
}
