'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';

interface NodeConfigPanelProps {
  workflowId: string;
}

export function NodeConfigPanel({ workflowId }: NodeConfigPanelProps) {
  const { workflows, selectedNode, setSelectedNode, updateNode, removeNode } = useWorkflowStore();
  const workflow = workflows.find((w) => w.id === workflowId);
  const node = workflow?.nodes.find((n) => n.id === selectedNode);

  if (!node) {
    return (
      <div className="w-[340px] glass-panel border-l border-white/10 flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <span className="text-2xl">👆</span>
        </div>
        <h3 className="text-white font-medium mb-2">No Node Selected</h3>
        <p className="text-white/50 text-sm">Click on a node to configure its settings</p>
      </div>
    );
  }

  const handleUpdateConfig = (key: string, value: unknown) => {
    updateNode(workflowId, node.id, {
      data: {
        ...node.data,
        config: {
          ...node.data.config,
          [key]: value,
        },
      },
    });
  };

  const handleDelete = () => {
    removeNode(workflowId, node.id);
    setSelectedNode(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="w-[340px] glass-panel border-l border-white/10 flex flex-col h-full"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">{node.data.label}</h3>
            <p className="text-white/50 text-xs">{node.type}</p>
          </div>
          <button
            onClick={() => setSelectedNode(null)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Config Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Node Name */}
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">
              Node Name
            </label>
            <input
              type="text"
              value={node.data.label}
              onChange={(e) =>
                updateNode(workflowId, node.id, {
                  data: { ...node.data, label: e.target.value },
                })
              }
              className="glass-input w-full px-4 py-2 rounded-lg text-white text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-white/60 text-xs uppercase tracking-wider mb-2 block">
              Description
            </label>
            <textarea
              value={node.data.description || ''}
              onChange={(e) =>
                updateNode(workflowId, node.id, {
                  data: { ...node.data, description: e.target.value },
                })
              }
              rows={3}
              className="glass-input w-full px-4 py-2 rounded-lg text-white text-sm resize-none"
            />
          </div>

          {/* Dynamic Config Fields */}
          {node.data.config && Object.keys(node.data.config).length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-white/80 text-sm font-medium mb-3">Configuration</h4>
              <div className="space-y-3">
                {Object.entries(node.data.config).map(([key, value]) => (
                  <div key={key}>
                    <label className="text-white/60 text-xs mb-1 block capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    {typeof value === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => handleUpdateConfig(key, e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-white/5"
                        />
                        <span className="text-white/80 text-sm">{value ? 'Enabled' : 'Disabled'}</span>
                      </label>
                    ) : typeof value === 'number' ? (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleUpdateConfig(key, parseFloat(e.target.value))}
                        className="glass-input w-full px-4 py-2 rounded-lg text-white text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={String(value)}
                        onChange={(e) => handleUpdateConfig(key, e.target.value)}
                        className="glass-input w-full px-4 py-2 rounded-lg text-white text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 flex gap-2">
          <button
            onClick={() => setSelectedNode(null)}
            className="flex-1 glass-button px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Done
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
