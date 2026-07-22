'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles } from 'lucide-react';

interface Message { role: 'user' | 'assistant'; content: string; }
interface ChatSession { _id: string; messages: Message[]; createdAt: string; }

export default function AIChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    try { const res = await fetch('/api/ai-chat'); if (res.ok) setSessions(await res.json()); } catch (e) { console.error(e); }
  };

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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, hsl(230 20% 5%) 0%, hsl(230 20% 7%) 50%, hsl(230 18% 9%) 100%)' }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Yurekh AI</h1>
          <p className="text-sm text-white/50 mt-1">Your intelligent business assistant</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="bg-[hsl(230_18%_10%)] rounded-2xl border border-[hsl(230_12%_18%)] h-[600px] flex flex-col" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {currentMessages.length === 0 ? (
                  <div className="text-center py-20">
                    <Sparkles className="w-12 h-12 text-[hsl(252_60%_55%)]/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-white/60">Start a conversation</p>
                    <p className="text-xs text-white/40 mt-1">Ask about invoices, customers, inventory, and more</p>
                  </div>
                ) : (
                  currentMessages.map((msg, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, hsl(252 60% 55% / 0.8), hsl(252 60% 55% / 0.5))' }}><Bot className="w-4 h-4 text-white" /></div>}
                      <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'text-white' : 'bg-white/5 text-white/80'}`}
                        style={msg.role === 'user' ? { background: 'linear-gradient(135deg, hsl(252 60% 55%) 0%, hsl(252 55% 45%) 100%)' } : {}}>
                        {msg.content}
                      </div>
                      {msg.role === 'user' && <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[hsl(252_60%_55%)]"><User className="w-4 h-4 text-white" /></div>}
                    </motion.div>
                  ))
                )}
                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(252 60% 55% / 0.8), hsl(252 60% 55% / 0.5))' }}><Bot className="w-4 h-4 text-white" /></div>
                    <div className="px-4 py-3 rounded-2xl bg-white/5 text-sm text-white/40">Thinking...</div>
                  </motion.div>
                )}
              </div>

              {/* Suggestions */}
              {currentMessages.length === 0 && (
                <div className="px-6 pb-4">
                  <p className="text-xs font-medium text-white/40 mb-2">Try asking:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => setInput(s)} className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-white/50 hover:bg-white/10 transition-colors">{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-[hsl(230_12%_18%)]">
                <div className="flex gap-3">
                  <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask about your business..."
                    className="flex-1 px-4 py-3 rounded-xl bg-[hsl(230_18%_12%)] border border-[hsl(230_12%_20%)] text-sm text-white placeholder-white/30 focus:outline-none focus:border-[hsl(252_60%_55%)]/50" />
                  <button type="submit" disabled={loading}
                    className="px-5 py-3 rounded-xl text-white text-sm font-semibold flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, hsl(252 60% 55%) 0%, hsl(252 55% 45%) 100%)' }}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sessions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-[hsl(230_18%_10%)] rounded-2xl border border-[hsl(230_12%_18%)] p-4" style={{ boxShadow: '0 4px 20px -8px rgb(0 0 0 / 0.3)' }}>
              <h3 className="text-sm font-semibold text-white mb-3">Recent Chats</h3>
              {sessions.length === 0 ? (
                <p className="text-xs text-white/40">No chat history</p>
              ) : (
                <div className="space-y-2">
                  {sessions.slice(0, 10).map(session => (
                    <div key={session._id} className="p-2 rounded-lg bg-white/5 text-xs text-white/40">
                      <p className="truncate">{session.messages[0]?.content}</p>
                      <p className="text-[10px] text-white/30 mt-1">{new Date(session.createdAt).toLocaleDateString()}</p>
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
