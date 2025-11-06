import { ethers } from "ethers";

interface TransactionHistoryProps {
  userTxs: any[];
  getTransactions: () => void;
  walletConnected: boolean;
}

export default function TransactionHistory({ userTxs, getTransactions, walletConnected }: TransactionHistoryProps) {
  if (!walletConnected) return null;

  return (
    <div>
      <hr className="my-4 border-gray-700" />
      <button
        onClick={getTransactions}
        className="w-full px-4 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700"
      >
        📜 View Transaction History
      </button>

      {userTxs.length > 0 && (
        <div className="mt-4 max-h-80 overflow-auto text-sm border border-gray-700 rounded-lg p-4 bg-gray-800 text-gray-300">
          {userTxs.map((tx, i) => {
            // Determine status
            let statusText = "⏳ Pending";
            let statusColor = "text-yellow-400";

            if (tx.confirmations && tx.confirmations > 0) {
              if (tx.isError === "0" || tx.isError === 0) {
                statusText = "✅ Success";
                statusColor = "text-green-400";
              } else {
                statusText = "❌ Failed";
                statusColor = "text-red-400";
              }
            }

            return (
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
                  <span className={statusColor}>{statusText}</span>

                  <span className="text-gray-400">Block:</span>
                  <span>{tx.blockNumber || "-"}</span>

                  <span className="text-gray-400">Timestamp:</span>
                  <span>{tx.timeStamp ? new Date(parseInt(tx.timeStamp) * 1000).toLocaleString() : "-"}</span>

                  <span className="text-gray-400">Confirmations:</span>
                  <span>{tx.confirmations || 0}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
