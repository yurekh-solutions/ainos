'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from '@xyflow/react';
import { Play, Save, Settings, Plus, Menu, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkflowStore } from '@/store/workflowStore';
import { WorkflowNode } from './WorkflowNode';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';
import type { WorkflowNode as WorkflowNodeType, WorkflowEdge } from '@/types/workflow';

const nodeTypes = {
  workflowNode: WorkflowNode,
};

interface WorkflowCanvasProps {
  workflowId: string;
}

export function WorkflowCanvas({ workflowId }: WorkflowCanvasProps) {
  const { workflows, updateWorkflow, addExecution } = useWorkflowStore();
  const workflow = workflows.find((w) => w.id === workflowId);
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    workflow?.nodes.map((n) => ({
      id: n.id,
      type: 'workflowNode',
      position: n.position,
      data: { ...n.data, workflowId },
    })) || []
  );
  
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    workflow?.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    })) || []
  );
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `e${connection.source}-${connection.target}`,
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(edge, eds));
      
      // Update store
      if (workflow) {
        const newEdge: WorkflowEdge = {
          id: edge.id,
          source: connection.source!,
          target: connection.target!,
          sourceHandle: connection.sourceHandle || undefined,
          targetHandle: connection.targetHandle || undefined,
        };
        updateWorkflow(workflowId, {
          edges: [...workflow.edges, newEdge],
        });
      }
    },
    [setEdges, workflow, workflowId, updateWorkflow]
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (workflow) {
        updateWorkflow(workflowId, {
          nodes: workflow.nodes.map((n) =>
            n.id === node.id ? { ...n, position: node.position } : n
          ),
        });
      }
    },
    [workflow, workflowId, updateWorkflow]
  );

  const handleExecute = async () => {
    setIsExecuting(true);
    const executionId = `exec-${Date.now()}`;
    
    addExecution({
      id: executionId,
      workflowId,
      status: 'running',
      startedAt: new Date().toISOString(),
    });

    // Simulate execution
    setTimeout(() => {
      addExecution({
        id: executionId,
        workflowId,
        status: 'completed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        results: { success: true, message: 'Workflow executed successfully' },
      });
      setIsExecuting(false);
    }, 2000);
  };

  const handleSave = () => {
    // Save workflow
    console.log('Saving workflow...');
  };

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-card p-8 text-center">
          <p className="text-white/60">Workflow not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full relative">
      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          className="workflow-canvas"
          defaultEdgeOptions={{
            animated: true,
            style: { stroke: '#6366f1', strokeWidth: 2 },
          }}
        >
          <Background color="rgba(255,255,255,0.1)" gap={20} size={1} />
          <Controls className="glass-card !border-none" />
          {/* MiniMap - Hidden on mobile */}
          <MiniMap
            className="glass-card !border-none hidden sm:block"
            nodeColor={(node) => {
              return (node.data?.color as string) || '#6366f1';
            }}
            maskColor="rgba(0,0,0,0.5)"
          />
          
          {/* Toolbar - Responsive */}
          <Panel position="top-left" className="m-2 sm:m-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-1.5 sm:p-2 flex items-center gap-1.5 sm:gap-2"
            >
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="glass-button px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Node</span>
              </button>
              <div className="w-px h-5 sm:h-6 bg-white/20" />
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="glass-button px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-white text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">{isExecuting ? 'Running...' : 'Execute'}</span>
              </button>
              <button
                onClick={handleSave}
                className="glass p-1.5 sm:p-2 rounded-lg text-white/80 hover:text-white transition-colors"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button className="glass p-1.5 sm:p-2 rounded-lg text-white/80 hover:text-white transition-colors hidden sm:flex">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </motion.div>
          </Panel>

          {/* Workflow Info - Hidden on mobile, visible on larger screens */}
          <Panel position="top-right" className="m-2 sm:m-4 hidden sm:block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-3 sm:p-4 max-w-[200px] sm:max-w-none"
            >
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">{workflow.name}</h3>
              <p className="text-white/60 text-xs sm:text-sm mt-1 line-clamp-2">{workflow.description}</p>
              <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 text-[10px] sm:text-xs text-white/40">
                <span>{nodes.length} nodes</span>
                <span>{edges.length} connections</span>
                <span className={workflow.isActive ? 'text-green-400' : 'text-yellow-400'}>
                  {workflow.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </motion.div>
          </Panel>
        </ReactFlow>

        {/* Node Palette */}
        <AnimatePresence>
          {showPalette && (
            <NodePalette
              onClose={() => setShowPalette(false)}
              workflowId={workflowId}
              onNodeAdd={(node) => {
                setNodes((nds) => [...nds, node as Node]);
                setShowPalette(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Panel Toggle Button */}
      <button
        onClick={() => setShowMobilePanel(true)}
        className="lg:hidden fixed bottom-4 right-4 z-30 glass-button p-3 rounded-full shadow-lg flex items-center gap-2"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Node Config Panel - Desktop: always visible, Mobile: overlay */}
      <div className="hidden lg:block">
        <NodeConfigPanel workflowId={workflowId} />
      </div>

      {/* Mobile Config Panel Overlay */}
      <AnimatePresence>
        {showMobilePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobilePanel(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-[85%] max-w-[340px] z-50"
            >
              <div className="h-full relative">
                <button
                  onClick={() => setShowMobilePanel(false)}
                  className="absolute top-4 left-4 z-10 p-2 rounded-lg bg-white/10 text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                <NodeConfigPanel workflowId={workflowId} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
