'use client';
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface ChatSession { id: string; messages: Array<{ role: string; content: string }>; createdAt: string; }

export default function AIChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try { const res = await fetch('/api/ai-chat'); if (res.ok) setSessions(await res.json()); } catch (e) { console.error(e); }
  }, []);

  // eslint-disable-next-line react-hooks/require-effect-dependencies
  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMessage: Message = { role: 'user', content: input };
    setCurrentMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      if (res.ok) {
        const data = await res.json();
        const assistantMessage: Message = { role: 'assistant', content: data.response };
        setCurrentMessages(prev => [...prev, assistantMessage]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const suggestions = ['How many invoices this month?', 'Top customers by revenue', 'Low stock items', 'Pending follow-ups', 'Employee attendance today'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">AINOS AI Assistant</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your intelligent business assistant</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 h-[600px] flex flex-col shadow-sm">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-20">
                    <Sparkles className="w-12 h-12 text-purple-300 dark:text-purple-700 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Start a conversation</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Ask about invoices, customers, inventory, and more</p>
                  </div>
                ) : (
                  currentMessages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100 dark:bg-purple-900/30"><Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>}
                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'}`}>
                        {msg.content}
                      </div>
                      {msg.role === 'user' && <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-600"><User className="w-4 h-4 text-white" /></div>}
                    </motion.div>
                  ))
                )}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/30"><Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
                    <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-500 dark:text-gray-400">Thinking...</div>
                  </motion.div>
                )}
              </div>

              {/* Suggestions */}
              {currentMessages.length === 0 && (
                <div className="px-6 pb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => setInput(s)} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-3">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your business..."
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-600" />
                  <button type="submit" disabled={loading}
                    className="px-5 py-3 rounded-xl text-white text-sm font-semibold flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sessions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Chats</h3>
              {sessions.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400">No chat history</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 10).map(session => (
                    <div key={session.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                      <p className="truncate">{session.messages?.[0]?.content || 'Chat'}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
