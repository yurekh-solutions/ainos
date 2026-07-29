'use client';

import { useState } from 'react';
import {
  Terminal,
  Workflow,
  Bot,
  DatabaseZap,
  Layers,
  SlidersHorizontal,
  Mic,
  Blocks,
  Clapperboard,
  Rocket,
  Gauge,
  Newspaper,
  GraduationCap,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface SkillItem {
  no: number;
  icon: typeof Terminal;
  title: string;
  description: string;
  tools: string[];
  level: 'Beginner' | 'Intermediate' | 'Advanced';
}

const SKILLS: SkillItem[] = [
  {
    no: 1,
    icon: Terminal,
    title: 'Prompt Engineering',
    description:
      'Learn to write clear, task-specific prompts that help AI models produce accurate and useful results.',
    tools: ['ChatGPT', 'Claude', 'Gemini'],
    level: 'Beginner',
  },
  {
    no: 2,
    icon: Workflow,
    title: 'AI Workflow',
    description:
      'Use tools like Zapier, Make and n8n to connect apps and set up time-saving automation — no coding is needed.',
    tools: ['Zapier', 'Make', 'n8n'],
    level: 'Beginner',
  },
  {
    no: 3,
    icon: Bot,
    title: 'AI Agents',
    description:
      'Build multi-agent systems using platforms like LangGraph, AutoGen and CrewAI to complete tasks that require reasoning, coordination and memory.',
    tools: ['LangGraph', 'AutoGen', 'CrewAI'],
    level: 'Advanced',
  },
  {
    no: 4,
    icon: DatabaseZap,
    title: 'Retrieval-Augmented Generation (RAG)',
    description:
      'Connect AI models to your own data using different frameworks to generate more accurate, source-backed answers.',
    tools: ['LlamaIndex', 'Astra DB', 'LangChain', 'Pinecone'],
    level: 'Intermediate',
  },
  {
    no: 5,
    icon: Layers,
    title: 'Multimodal AI',
    description:
      'Use advanced models like ChatGPT, Claude, Gemini and Grok that can understand text, images, code and audio in a single chat.',
    tools: ['ChatGPT', 'Claude', 'Gemini', 'Grok'],
    level: 'Beginner',
  },
  {
    no: 6,
    icon: SlidersHorizontal,
    title: 'Fine-Tuning & AI Assistants',
    description:
      'Create domain-specific AI assistants or fine-tune models using platforms like OpenAI GPT Builder, Hugging Face and Cohere.',
    tools: ['OpenAI', 'Hugging Face', 'Cohere'],
    level: 'Advanced',
  },
  {
    no: 7,
    icon: Mic,
    title: 'Voice AI & Avatars',
    description:
      'Generate realistic voiceovers and talking avatars for videos or training using tools like ElevenLabs, HeyGen and Synthesia.',
    tools: ['ElevenLabs', 'HeyGen', 'Synthesia', 'VAPI'],
    level: 'Intermediate',
  },
  {
    no: 8,
    icon: Blocks,
    title: 'AI Tool Stacking',
    description:
      'Combine platforms like Notion, ClickUp, Zapier and Asana to build custom AI workflows across various tasks and automation.',
    tools: ['Notion', 'ClickUp', 'Zapier', 'Asana'],
    level: 'Intermediate',
  },
  {
    no: 9,
    icon: Clapperboard,
    title: 'AI Video Content Generation',
    description:
      'Turn text or scripts into videos using tools like Runway, VEED and Opus. Add voice, edit scenes and create content faster.',
    tools: ['Runway', 'VEED', 'Opus'],
    level: 'Intermediate',
  },
  {
    no: 10,
    icon: Rocket,
    title: 'SaaS Development',
    description:
      'Use no-code builders like Bubble, Cursor and Lovable to build lightweight SaaS apps with AI features and real user workflows.',
    tools: ['Bubble', 'Cursor', 'Lovable'],
    level: 'Advanced',
  },
  {
    no: 11,
    icon: Gauge,
    title: 'LLM Management',
    description:
      'Track accuracy, latency and cost using platforms like PromptLayer, Helicone and TruLens to know how your AI performs.',
    tools: ['PromptLayer', 'Helicone', 'TruLens'],
    level: 'Advanced',
  },
  {
    no: 12,
    icon: Newspaper,
    title: 'Staying Updated',
    description:
      'Follow top tech sites like TechCrunch, The Verge and MIT Tech Review to stay on top of new tools, product updates and breakthroughs.',
    tools: ['TechCrunch', 'The Verge', 'MIT Tech Review'],
    level: 'Beginner',
  },
];

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'] as const;

const LEVEL_CLASSES: Record<string, string> = {
  Beginner: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  Intermediate: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  Advanced: 'bg-red-500/10 text-red-500 border-red-500/30',
};

export default function AiSkillsPage() {
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All');
  const [query, setQuery] = useState('');

  const filtered = SKILLS.filter((s) => {
    const matchLevel = level === 'All' || s.level === level;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tools.some((t) => t.toLowerCase().includes(q));
    return matchLevel && matchQuery;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="rounded-xl border p-6" style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}>
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <span className="w-12 h-12 rounded-xl bg-[#1BE1D3]/10 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-[#1BE1D3]" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                12 AI Skills to Learn in 2026
              </h1>
              <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
                Learn consistently. Build creatively. Stay ahead with AI — future-proof your skills.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1BE1D3]" /> Learn consistently — build a habit
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#1BE1D3]" /> Build creatively — apply and create
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-2 flex-1 min-w-[220px] rounded-lg border px-3.5 py-2.5"
          style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
        >
          <Search className="w-4 h-4 text-[#1BE1D3] shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills or tools..."
            className="w-full bg-transparent text-sm outline-none"
            style={{ color: 'hsl(var(--foreground))' }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                level === l
                  ? 'bg-[#1BE1D3] text-black border-[#1BE1D3]'
                  : 'hover:border-[#1BE1D3]/40'
              }`}
              style={
                level === l
                  ? undefined
                  : { borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
              }
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Skills grid */}
      {filtered.length === 0 ? (
        <div
          className="rounded-xl border border-dashed p-12 text-center text-sm"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
        >
          No skills match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((skill) => {
            const Icon = skill.icon;
            return (
              <div
                key={skill.no}
                className="group rounded-xl border p-5 space-y-3 hover:border-[#1BE1D3]/40 transition-colors"
                style={{ borderColor: 'hsl(var(--border))', background: 'hsl(var(--card))' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg bg-[#1BE1D3]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#1BE1D3]" />
                    </span>
                    <span
                      className="text-xs font-semibold w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-[#1BE1D3]/10 text-[#1BE1D3]"
                    >
                      {skill.no}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0 ${LEVEL_CLASSES[skill.level]}`}
                  >
                    {skill.level}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                    {skill.title}
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                    {skill.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skill.tools.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded-md text-[11px] border"
                      style={{
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--muted-foreground))',
                        background: 'hsl(var(--border) / 0.3)',
                      }}
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
