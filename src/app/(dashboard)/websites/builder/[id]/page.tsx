'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye, Plus, Trash2, GripVertical, Type, Image, RectangleHorizontal, List, Mail, Star, ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface Block { id: string; type: string; props: Record<string, string>; }
interface PageItem { id: string; title: string; slug: string; status: string; isHome: boolean; content: Block[]; }

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Section', icon: RectangleHorizontal },
  { type: 'features', label: 'Features', icon: Star },
  { type: 'text', label: 'Text Block', icon: Type },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'gallery', label: 'Gallery', icon: Image },
  { type: 'pricing', label: 'Pricing', icon: List },
  { type: 'testimonials', label: 'Testimonials', icon: Star },
  { type: 'cta', label: 'Call to Action', icon: RectangleHorizontal },
  { type: 'contact', label: 'Contact Form', icon: Mail },
  { type: 'footer', label: 'Footer', icon: RectangleHorizontal },
];

const DEFAULT_PROPS: Record<string, Record<string, string>> = {
  hero: { title: 'Welcome', subtitle: 'Build something amazing', buttonText: 'Get Started', bgColor: '#6D28D9' },
  features: { title: 'Features', feature1: 'Feature 1', feature2: 'Feature 2', feature3: 'Feature 3' },
  text: { content: 'Enter your text here...', fontSize: '16' },
  image: { src: '', alt: 'Image', caption: '' },
  gallery: { title: 'Gallery', images: '' },
  pricing: { title: 'Pricing', plan1Name: 'Basic', plan1Price: '999', plan2Name: 'Pro', plan2Price: '1999' },
  testimonials: { title: 'Testimonials', quote: 'Great product!', author: 'Happy Customer' },
  cta: { title: 'Ready to start?', buttonText: 'Contact Us', bgColor: '#6D28D9' },
  contact: { title: 'Contact Us', email: 'info@example.com', phone: '+91 9876543210' },
  footer: { copyright: '2025 Company', links: 'Home, About, Contact' },
};

export default function WebsiteBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const websiteId = params.id as string;
  const [pages, setPages] = useState<PageItem[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [showAddBlock, setShowAddBlock] = useState(false);

  const blockCounter = useRef(0);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch(`/api/websites/pages?websiteId=${websiteId}`);
      if (res.ok) {
        const data = await res.json();
        setPages(data);
        if (data.length > 0) {
          const home = data.find((p: PageItem) => p.isHome) || data[0];
          setActivePageId(home.id);
          setBlocks(Array.isArray(home.content) ? home.content : []);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [websiteId]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const selectPage = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) { setActivePageId(pageId); setBlocks(Array.isArray(page.content) ? page.content : []); setSelectedBlock(null); }
  };

  const addBlock = (type: string) => {
    blockCounter.current += 1;
    const newBlock: Block = { id: `block-${blockCounter.current}`, type, props: { ...DEFAULT_PROPS[type] } };
    setBlocks([...blocks, newBlock]);
    setShowAddBlock(false);
    setSelectedBlock(newBlock.id);
  };

  const removeBlock = (id: string) => { setBlocks(blocks.filter(b => b.id !== id)); if (selectedBlock === id) setSelectedBlock(null); };
  const moveBlock = (index: number, dir: -1 | 1) => {
    const newBlocks = [...blocks]; const target = index + dir;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlockProp = (blockId: string, key: string, value: string) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, props: { ...b.props, [key]: value } } : b));
  };

  const savePage = async () => {
    if (!activePageId) return;
    try {
      const res = await fetch(`/api/websites/pages?id=${activePageId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: blocks })
      });
      if (res.ok) alert('Page saved!');
    } catch (e) { console.error(e); }
  };

  const addNewPage = async () => {
    const title = prompt('Page title:');
    if (!title) return;
    try {
      const res = await fetch('/api/websites/pages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, websiteId, content: [] })
      });
      if (res.ok) { const page = await res.json(); fetchPages(); setActivePageId(page.id); setBlocks([]); }
    } catch (e) { console.error(e); }
  };

  const renderBlockPreview = (block: Block) => {
    switch (block.type) {
      case 'hero': return <div className="p-6 text-center" style={{ background: block.props.bgColor || '#6D28D9' }}><h2 className="text-xl font-bold text-white">{block.props.title}</h2><p className="text-white/80 text-sm mt-1">{block.props.subtitle}</p><button className="mt-3 px-4 py-1.5 bg-white text-purple-700 rounded-lg text-xs font-medium">{block.props.buttonText}</button></div>;
      case 'features': return <div className="p-4"><h3 className="font-semibold text-sm mb-2" style={{ color: 'hsl(var(--foreground))' }}>{block.props.title}</h3><div className="grid grid-cols-3 gap-2">{[1,2,3].map(n => <div key={n} className="p-2 rounded text-center text-xs" style={{ background: 'hsl(var(--background))' }}>{block.props[`feature${n}`]}</div>)}</div></div>;
      case 'text': return <div className="p-4"><p style={{ color: 'hsl(var(--foreground))', fontSize: `${block.props.fontSize || 16}px` }}>{block.props.content}</p></div>;
      case 'image': return <div className="p-4 text-center"><div className="w-full h-20 rounded flex items-center justify-center" style={{ background: 'hsl(var(--background))' }}><Image className="w-8 h-8" style={{ color: 'hsl(var(--muted-foreground))' }} /></div>{block.props.caption && <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{block.props.caption}</p>}</div>;
      case 'cta': return <div className="p-4 text-center" style={{ background: block.props.bgColor || '#6D28D9' }}><h3 className="text-white font-semibold text-sm">{block.props.title}</h3><button className="mt-2 px-4 py-1.5 bg-white text-purple-700 rounded-lg text-xs font-medium">{block.props.buttonText}</button></div>;
      case 'contact': return <div className="p-4"><h3 className="font-semibold text-sm mb-2" style={{ color: 'hsl(var(--foreground))' }}>{block.props.title}</h3><p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{block.props.email} | {block.props.phone}</p></div>;
      default: return <div className="p-4 text-center text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{block.type} block</div>;
    }
  };

  if (loading) return <div className="p-6 h-full flex items-center justify-center" style={{ background: 'var(--page-gradient)' }}><p style={{ color: 'hsl(var(--muted-foreground))' }}>Loading builder...</p></div>;

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--page-gradient)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/websites')} className="p-1.5 rounded-lg hover:bg-white/10"><ArrowLeft className="w-4 h-4" style={{ color: 'hsl(var(--foreground))' }} /></button>
          <h1 className="text-lg font-semibold" style={{ color: 'hsl(var(--foreground))' }}>Website Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}><Eye className="w-3.5 h-3.5" />{showPreview ? 'Edit' : 'Preview'}</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={savePage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' }}><Save className="w-3.5 h-3.5" /> Save</motion.button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: pages list */}
        <div className="w-56 border-r flex flex-col overflow-y-auto" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'hsl(var(--border))' }}>
            <span className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>PAGES</span>
            <button onClick={addNewPage} className="p-1 rounded hover:bg-white/10"><Plus className="w-3.5 h-3.5" style={{ color: '#8B5CF6' }} /></button>
          </div>
          <div className="p-2 space-y-1">
            {pages.map(p => (
              <button key={p.id} onClick={() => selectPage(p.id)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${p.id === activePageId ? 'text-white' : ''}`}
                style={p.id === activePageId ? { background: 'linear-gradient(135deg, #6D28D9, #8B5CF6)' } : { color: 'hsl(var(--foreground))' }}>
                <div className="flex items-center gap-2"><FileText className="w-3 h-3" />{p.title}{p.isHome && <span className="ml-auto text-[10px] opacity-60">Home</span>}</div>
              </button>))}
          </div>
        </div>

        {/* Main canvas */}
        <div className="flex-1 overflow-y-auto p-4">
          {showPreview ? (
            <div className="max-w-2xl mx-auto rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))', background: 'white' }}>
              {blocks.map(b => <div key={b.id}>{renderBlockPreview(b)}</div>)}
              {blocks.length === 0 && <p className="text-center py-12 text-gray-400 text-sm">No blocks yet. Add blocks to build your page.</p>}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-2">
              {blocks.map((block, i) => {
                const BT = BLOCK_TYPES.find(b => b.type === block.type);
                const isSelected = selectedBlock === block.id;
                return (
                  <motion.div key={block.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedBlock(block.id)}
                    className={`rounded-xl border cursor-pointer transition-all ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
                    style={{ borderColor: isSelected ? '#8B5CF6' : 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                      <GripVertical className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
                      {BT && <BT.icon className="w-4 h-4" style={{ color: '#8B5CF6' }} />}
                      <span className="text-xs font-medium flex-1" style={{ color: 'hsl(var(--foreground))' }}>{BT?.label || block.type}</span>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(i, -1); }} className="p-0.5 rounded hover:bg-white/10"><ChevronUp className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(i, 1); }} className="p-0.5 rounded hover:bg-white/10"><ChevronDown className="w-3 h-3" style={{ color: 'hsl(var(--muted-foreground))' }} /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }} className="p-0.5 rounded hover:bg-white/10"><Trash2 className="w-3.5 h-3.5" style={{ color: '#ef4444' }} /></button>
                    </div>
                    {isSelected && (
                      <div className="p-3 space-y-2">
                        {Object.entries(block.props).map(([key, val]) => (
                          <div key={key}><label className="block text-xs mb-0.5 capitalize" style={{ color: 'hsl(var(--muted-foreground))' }}>{key}</label>
                            {key === 'bgColor' ? <input type="color" value={val} onChange={e => updateBlockProp(block.id, key, e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
                              : key === 'content' ? <textarea value={val} onChange={e => updateBlockProp(block.id, key, e.target.value)} rows={3} className="w-full px-2 py-1.5 rounded border text-xs" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                              : <input value={val} onChange={e => updateBlockProp(block.id, key, e.target.value)} className="w-full px-2 py-1.5 rounded border text-xs" style={{ background: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />}
                          </div>))}
                      </div>
                    )}
                    {!isSelected && <div className="pointer-events-none">{renderBlockPreview(block)}</div>}
                  </motion.div>);
              })}

              <button onClick={() => setShowAddBlock(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed text-sm font-medium transition-colors hover:border-purple-500"
                style={{ borderColor: 'hsl(var(--border))', color: '#8B5CF6' }}>
                <Plus className="w-4 h-4 inline mr-1" /> Add Block
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add block modal */}
      {showAddBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg rounded-xl p-6 border" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'hsl(var(--foreground))' }}>Add Block</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BLOCK_TYPES.map(bt => (
                <button key={bt.type} onClick={() => addBlock(bt.type)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border hover:border-purple-500 transition-colors"
                  style={{ borderColor: 'hsl(var(--border))' }}>
                  <bt.icon className="w-6 h-6" style={{ color: '#8B5CF6' }} />
                  <span className="text-xs font-medium" style={{ color: 'hsl(var(--foreground))' }}>{bt.label}</span>
                </button>))}
            </div>
            <button onClick={() => setShowAddBlock(false)} className="mt-4 w-full py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>Cancel</button>
          </motion.div>
        </div>)}
    </div>
  );
}
