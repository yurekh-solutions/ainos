import mongoose from 'mongoose';

export interface IGeneratedSite {
  _id?: string;
  businessName: string;
  industry: string;
  description: string;
  siteType: string; // Website Development, Landing Pages, E-commerce, Microsite, Digital Visiting Card...
  theme: 'modern' | 'minimal' | 'bold';
  primaryColor: string;
  html: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const GeneratedSiteSchema = new mongoose.Schema<IGeneratedSite>(
  {
    businessName: { type: String, required: true },
    industry: { type: String, required: true },
    description: { type: String, default: '' },
    siteType: { type: String, default: 'Website Development' },
    theme: { type: String, enum: ['modern', 'minimal', 'bold'], default: 'modern' },
    primaryColor: { type: String, default: '#6d5df6' },
    html: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

GeneratedSiteSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.models.GeneratedSite || mongoose.model<IGeneratedSite>('GeneratedSite', GeneratedSiteSchema);
