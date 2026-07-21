import mongoose from 'mongoose';

export interface IDocument {
  _id?: string;
  title: string;
  type: string;
  fileUrl?: string;
  expiryDate?: Date;
  tags: string[];
  relatedEntity?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new mongoose.Schema<IDocument>(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    fileUrl: String,
    expiryDate: Date,
    tags: [{ type: String }],
    relatedEntity: String,
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
