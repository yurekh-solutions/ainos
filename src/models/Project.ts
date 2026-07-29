import mongoose from 'mongoose';

export interface IProject {
  _id?: string;
  name: string;
  description?: string;
  status: 'active' | 'on_hold' | 'completed';
  color?: string;
  dueDate?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new mongoose.Schema<IProject>(
  {
    name: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed'],
      default: 'active',
    },
    color: { type: String, default: '#1BE1D3' },
    dueDate: Date,
    createdBy: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Project ||
  mongoose.model<IProject>('Project', ProjectSchema);
