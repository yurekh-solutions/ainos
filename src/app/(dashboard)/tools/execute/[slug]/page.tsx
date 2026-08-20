'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Coins, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  creditCost: number;
}

export default function ToolExecutePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; output?: unknown; error?: string; newBalance?: number } | null>(null);
  const [input, setInput] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/ainos/api/tools?slug=${slug}`)
      .then(res => res.json())
      .then(data => { setTool(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleExecute = async () => {
    setExecuting(true);
    setResult(null);
    try {
      const res = await fetch('/ainos/api/tools/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: slug, input })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ success: false, error: 'Network error' });
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return <div className="p-6"><div className="h-48 bg-gray-800 rounded-xl animate-pulse" /></div>;
  }

  if (!tool) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-gray-300">Tool not found</h2>
        <button onClick={() => router.push('/ainos/tools')} className="mt-4 text-purple-400 hover:underline">Back to tools</button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => router.push('/ainos/tools')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Tools
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{tool.name}</h1>
            <p className="text-gray-400 text-sm">{tool.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Coins className="w-4 h-4 text-yellow-400" />
          Cost: {tool.creditCost} credits per execution
        </div>
      </motion.div>

      {/* Input Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Input Parameters</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Topic / Subject</label>
            <input
              type="text"
              value={input.topic || ''}
              onChange={e => setInput({ ...input, topic: e.target.value })}
              placeholder="Enter topic..."
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Additional Details</label>
            <textarea
              value={input.details || ''}
              onChange={e => setInput({ ...input, details: e.target.value })}
              placeholder="Any additional details..."
              rows={4}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
            />
          </div>
        </div>
        <button
          onClick={handleExecute}
          disabled={executing}
          className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {executing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
          {executing ? 'Executing...' : 'Execute Tool'}
        </button>
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-6 border ${result.success ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
          <div className="flex items-center gap-2 mb-3">
            {result.success ? <CheckCircle className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <h3 className="font-semibold text-white">{result.success ? 'Success' : 'Error'}</h3>
          </div>
          {result.error && <p className="text-red-300 text-sm">{result.error}</p>}
          {result.output != null && (
            <pre className="mt-2 p-3 bg-gray-900 rounded-lg text-sm text-gray-300 overflow-auto max-h-64">
              {String(typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2))}
            </pre>
          )}
        </motion.div>
      )}
    </div>
  );
}
