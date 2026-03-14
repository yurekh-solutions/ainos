'use client';

import { memo } from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import { 
  Play, Clock, Webhook, Mail, FileText, Send, Bell, 
  CreditCard, BarChart3, User, UserPlus, GitBranch, 
  Timer, Globe, Table, Settings, Zap 
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Play,
  Clock,
  Webhook,
  Mail,
  FileText,
  Send,
  Bell,
  CreditCard,
  BarChart3,
  User,
  UserPlus,
  GitBranch,
  Timer,
  Globe,
  Table,
  Settings,
  Zap,
};

interface WorkflowNodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  workflowId: string;
  config?: Record<string, unknown>;
}

interface WorkflowNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
}

export const WorkflowNode = memo(function WorkflowNode({ id, data, selected }: WorkflowNodeProps) {
  const { selectedNode, setSelectedNode, nodeTypes } = useWorkflowStore();
  const isSelected = selected || selectedNode === id;
  
  const nodeType = nodeTypes.find((nt) => 
    nt.label === data.label || nt.type.includes(data.label.toLowerCase().replace(' ', '-'))
  );
  
  const Icon = data.icon && iconMap[data.icon] ? iconMap[data.icon] : Zap;
  const color = data.color || nodeType?.color || '#6366f1';

  const handleClick = () => {
    setSelectedNode(isSelected ? null : id);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        workflow-node min-w-[180px] cursor-pointer
        ${isSelected ? 'selected' : ''}
      `}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: color }}
      />
      
      {/* Node Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-medium text-sm truncate">{data.label}</h4>
            {data.description && (
              <p className="text-white/50 text-xs truncate">{data.description}</p>
            )}
          </div>
        </div>
        
        {/* Config Preview */}
        {data.config && Object.keys(data.config).length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-1">
              {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
                <span
                  key={key}
                  className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/60"
                >
                  {key}: {String(value).slice(0, 15)}
                </span>
              ))}
              {Object.keys(data.config).length > 2 && (
                <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-white/60">
                  +{Object.keys(data.config).length - 2} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Status Indicator */}
        <div className="absolute -top-1 -right-1">
          <div
            className="w-3 h-3 rounded-full border-2 border-[#0f172a]"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-white !border-2"
        style={{ borderColor: color }}
      />
    </div>
  );
});
