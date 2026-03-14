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
import { Play, Save, Settings, Trash2, Copy, Download } from 'lucide-react';
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
  
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflow?.nodes.map((n) => ({
      id: n.id,
      type: 'workflowNode',
      position: n.position,
      data: { ...n.data, workflowId },
    })) || []
  );
  
  const [edges, setEdges, onEdgesChange] = useEdgesState(
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
    <div className="flex h-full">
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
          <MiniMap
            className="glass-card !border-none"
            nodeColor={(node) => {
              return node.data?.color || '#6366f1';
            }}
            maskColor="rgba(0,0,0,0.5)"
          />
          
          {/* Toolbar */}
          <Panel position="top-left" className="m-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-2 flex items-center gap-2"
            >
              <button
                onClick={() => setShowPalette(!showPalette)}
                className="glass-button px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2"
              >
                <span>+</span> Add Node
              </button>
              <div className="w-px h-6 bg-white/20" />
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="glass-button px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                <Play className="w-4 h-4" />
                {isExecuting ? 'Running...' : 'Execute'}
              </button>
              <button
                onClick={handleSave}
                className="glass p-2 rounded-lg text-white/80 hover:text-white transition-colors"
              >
                <Save className="w-5 h-5" />
              </button>
              <button className="glass p-2 rounded-lg text-white/80 hover:text-white transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </motion.div>
          </Panel>

          {/* Workflow Info */}
          <Panel position="top-right" className="m-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-4"
            >
              <h3 className="text-white font-semibold">{workflow.name}</h3>
              <p className="text-white/60 text-sm mt-1">{workflow.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-white/40">
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
                setNodes((nds) => [...nds, node]);
                setShowPalette(false);
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Node Config Panel - fixed width sidebar */}
      <NodeConfigPanel workflowId={workflowId} />
    </div>
  );
}
