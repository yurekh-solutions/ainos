'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, CreditCard, Clock } from 'lucide-react';

interface CreditPack {
  credits: number;
  price: number;
  label: string;
  popular?: boolean;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export default function CreditsPage() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/ainos/api/billing/credits').then(r => r.json()),
      fetch('/ainos/api/billing/checkout').then(r => r.json())
    ]).then(([creditsData, packsData]) => {
      setBalance(creditsData.balance || 0);
      setHistory(creditsData.history || []);
      setPacks(packsData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleBuy = async (pack: CreditPack) => {
    setBuying(pack.credits);
    try {
      const res = await fetch('/ainos/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creditPackId: pack.credits })
      });
      const data = await res.json();
      if (data.orderId) {
        // Razorpay checkout would open here
        alert(`Order created: ${data.orderId}\nAmount: ₹${data.amount}\nCredits: ${data.credits}\n\nRazorpay integration will be enabled once API keys are configured.`);
      }
    } catch (e) {
      alert('Payment integration coming soon!');
    } finally {
      setBuying(null);
    }
  };

  if (loading) {
    return <div className="p-6"><div className="h-48 bg-gray-800 rounded-xl animate-pulse" /></div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Credits & Billing</h1>
        <p className="text-gray-400">Manage your credits and purchase more for tool executions.</p>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-purple-600/30 flex items-center justify-center">
            <Coins className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Available Credits</p>
            <p className="text-3xl font-bold text-white">{balance.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Credit Packs */}
      <h2 className="text-xl font-semibold text-white mb-4">Purchase Credits</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {packs.map((pack, i) => (
          <motion.div
            key={pack.credits}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative bg-gray-800/50 border rounded-xl p-5 ${pack.popular ? 'border-purple-500' : 'border-gray-700/50'}`}
          >
            {pack.popular && (
              <span className="absolute -top-2 right-3 px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">Popular</span>
            )}
            <p className="text-gray-400 text-sm">{pack.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{pack.credits.toLocaleString()} <span className="text-sm text-gray-400">credits</span></p>
            <p className="text-purple-400 font-semibold mt-2">₹{pack.price}</p>
            <button
              onClick={() => handleBuy(pack)}
              disabled={buying !== null}
              className="mt-3 w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {buying === pack.credits ? 'Processing...' : 'Buy Now'}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Transaction History */}
      <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>
      {history.length === 0 ? (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-8 text-center">
          <Clock className="w-10 h-10 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map(tx => (
            <div key={tx.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                  {tx.type === 'credit' ? <TrendingUp className="w-4 h-4 text-green-400" /> : <CreditCard className="w-4 h-4 text-red-400" />}
                </div>
                <div>
                  <p className="text-sm text-white">{tx.description || tx.type}</p>
                  <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'credit' ? '+' : ''}{tx.amount}
                </p>
                <p className="text-xs text-gray-500">Balance: {tx.balanceAfter}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
