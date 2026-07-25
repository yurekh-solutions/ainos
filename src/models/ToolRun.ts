import mongoose from 'mongoose';

// A ToolRun is a saved deliverable produced by an AINOS AI tool (logo, brandkit, seo, ...)
export interface IToolRun {
  _id?: string;
  tool: string;
  serviceName: string;
  businessName: string;
  inputs: Record<string, string>;
  output: Record<string, unknown>;
  aiUsed: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ToolRunSchema = new mongoose.Schema<IToolRun>(
  {
    tool: { type: String, required: true },
    serviceName: { type: String, default: '' },
    businessName: { type: String, default: '' },
    inputs: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, required: true },
    aiUsed: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

ToolRunSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.models.ToolRun || mongoose.model<IToolRun>('ToolRun', ToolRunSchema);
