'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Search, Play, Clock, Webhook, Mail, FileText, Send, Bell, CreditCard, BarChart3, User, UserPlus, GitBranch, Timer, Globe, Table } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import type { Node } from '@xyflow/react';
import type { WorkflowNode } from '@/types/workflow';

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Play, Clock, Webhook, Mail, FileText, Send, Bell, CreditCard, BarChart3,
  User, UserPlus, GitBranch, Timer, Globe, Table,
};

interface NodePaletteProps {
  onClose: () => void;
  workflowId: string;
  onNodeAdd: (node: Node) => void;
}

export function NodePalette({ onClose, workflowId, onNodeAdd }: NodePaletteProps) {
  const { nodeTypes, addNode, workflows } = useWorkflowStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const workflow = workflows.find((w) => w.id === workflowId);
  
  // Calculate next ID for each node type based on existing nodes
  const getNextNodeId = (nodeType: string) => {
    if (!workflow) return `${nodeType}-1`;
    const existingNodes = workflow.nodes.filter((n) => n.type === nodeType);
    const maxNum = existingNodes.reduce((max, node) => {
      const match = node.id.match(new RegExp(`${nodeType}-(\\d+)`));
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    return `${nodeType}-${maxNum + 1}`;
  };

  const categories = Array.from(new Set(nodeTypes.map((nt) => nt.category)));

  const filteredNodes = nodeTypes.filter((node) => {
    const matchesSearch = node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         node.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || node.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddNode = (nodeType: typeof nodeTypes[0]) => {
    const nodeId = getNextNodeId(nodeType.type);
    const nodeCount = workflow?.nodes.length ?? 0;
    // Position nodes in the left area, away from the config panel (which is on the right)
    const posX = 100 + ((nodeCount * 60) % 250);
    const posY = 150 + ((nodeCount * 50) % 250);
    
    const newNodeData = {
      label: nodeType.label,
      description: nodeType.description,
      icon: nodeType.icon,
      color: nodeType.color,
      workflowId,
      config: nodeType.defaultConfig || {},
    };
    
    const newNode: Node = {
      id: nodeId,
      type: 'workflowNode',
      position: { x: posX, y: posY },
      data: newNodeData,
    };

    const workflowNode: WorkflowNode = {
      id: nodeId,
      type: nodeType.type,
      position: { x: posX, y: posY },
      data: {
        label: nodeType.label,
        description: nodeType.description,
        icon: nodeType.icon,
        color: nodeType.color,
        config: nodeType.defaultConfig || {},
      },
    };

    addNode(workflowId, workflowNode);
    onNodeAdd(newNode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      className="absolute left-4 top-20 bottom-4 w-80 glass-card z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Node Palette</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg text-white text-sm"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-white/10">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !selectedCategory
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Node List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredNodes.map((nodeType) => {
          const Icon = iconMap[nodeType.icon] || FileText;
          return (
            <motion.button
              key={nodeType.type}
              onClick={() => handleAddNode(nodeType)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full glass p-3 rounded-xl text-left hover:bg-white/10 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${nodeType.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: nodeType.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium text-sm truncate">{nodeType.label}</h4>
                  <p className="text-white/50 text-xs truncate">{nodeType.description}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/40">
                  {nodeType.category}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
