import mongoose from 'mongoose';

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IAIChatSession {
  _id?: string;
  userId: string;
  messages: IChatMessage[];
  context: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new mongoose.Schema<IChatMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const AIChatSessionSchema = new mongoose.Schema<IAIChatSession>(
  {
    userId: { type: String, required: true },
    messages: [ChatMessageSchema],
    context: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.AIChatSession || mongoose.model<IAIChatSession>('AIChatSession', AIChatSessionSchema);
