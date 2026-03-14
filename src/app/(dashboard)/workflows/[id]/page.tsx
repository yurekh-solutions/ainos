'use client';

import { use } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';

interface WorkflowPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WorkflowPage({ params }: WorkflowPageProps) {
  const { id } = use(params);
  
  return (
    <div className="h-full">
      <ReactFlowProvider>
        <WorkflowCanvas workflowId={id} />
      </ReactFlowProvider>
    </div>
  );
}
