import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeArticle extends Document {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  author: mongoose.Types.ObjectId;
  views?: number;
  helpful?: number;
  notHelpful?: number;
  isPublic: boolean;
  slug?: string;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeArticleSchema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  tags: [String],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: false },
  slug: { type: String, unique: true },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.KnowledgeArticle || mongoose.model<IKnowledgeArticle>('KnowledgeArticle', KnowledgeArticleSchema);
