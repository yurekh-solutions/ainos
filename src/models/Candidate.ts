import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidate extends Document {
  name: string;
  email: string;
  phone?: string;
  position: string;
  department?: string;
  source: 'website' | 'referral' | 'linkedin' | 'naukri' | 'indeed' | 'other';
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  experience?: number;
  currentSalary?: number;
  expectedSalary?: number;
  resumeUrl?: string;
  skills?: string[];
  education?: string;
  interviewDate?: Date;
  interviewNotes?: string;
  rating?: number;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  position: { type: String, required: true },
  department: String,
  source: { type: String, enum: ['website', 'referral', 'linkedin', 'naukri', 'indeed', 'other'], default: 'website' },
  status: { type: String, enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'], default: 'applied' },
  experience: Number,
  currentSalary: Number,
  expectedSalary: Number,
  resumeUrl: String,
  skills: [String],
  education: String,
  interviewDate: Date,
  interviewNotes: String,
  rating: { type: Number, min: 1, max: 5 },
  notes: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.Candidate || mongoose.model<ICandidate>('Candidate', CandidateSchema);
