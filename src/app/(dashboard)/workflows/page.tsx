'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Play, Pause, MoreVertical, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useWorkflowStore } from '@/store/workflowStore';

export default function WorkflowsPage() {
  const { workflows, clearDuplicateWorkflows } = useWorkflowStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Clear duplicates on mount if any exist
  useEffect(() => {
    const ids = workflows.map(w => w.id);
    const hasDuplicates = ids.some((id, index) => ids.indexOf(id) !== index);
    if (hasDuplicates) {
      clearDuplicateWorkflows();
    }
  }, [workflows, clearDuplicateWorkflows]);

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && w.isActive) || 
      (filter === 'inactive' && !w.isActive);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Workflows</h1>
            <p className="text-white/60 mt-1 text-sm sm:text-base">Manage and monitor your automation workflows</p>
          </div>
          <Link
            href="/workflows/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-xl text-white text-sm font-medium transition-all shadow-lg shadow-white/5 hover:shadow-white/10 active:scale-95"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>New Workflow</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="glass-card p-4 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:bg-white/10'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Workflows Grid */}
        {filteredWorkflows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow, index) => (
              <motion.div
                key={workflow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card p-6 group hover:border-white/20 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    workflow.isActive ? 'bg-green-500/20' : 'bg-yellow-500/20'
                  }`}>
                    {workflow.isActive ? (
                      <Play className="w-6 h-6 text-green-400" />
                    ) : (
                      <Pause className="w-6 h-6 text-yellow-400" />
                    )}
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <Link href={`/workflows/${workflow.id}`}>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
                    {workflow.name}
                  </h3>
                </Link>
                <p className="text-white/50 text-sm mb-4 line-clamp-2">{workflow.description}</p>

                <div className="flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {workflow.nodes.length} nodes
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(workflow.updatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    workflow.isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {workflow.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-white/40">
                    {workflow.triggerType || 'Manual'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-10 h-10 text-white/20" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No workflows yet</h3>
            <p className="text-white/50 mb-6">Create your first automation workflow to get started</p>
            <Link
              href="/workflows/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm rounded-xl text-white font-medium transition-all shadow-lg shadow-white/5 hover:shadow-white/10 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Create Workflow
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
