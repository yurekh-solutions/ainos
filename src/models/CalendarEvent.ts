import mongoose, { Schema, Document } from 'mongoose';

export interface ICalendarEvent extends Document {
  title: string;
  description?: string;
  type: 'meeting' | 'task' | 'reminder' | 'event' | 'holiday';
  startDate: Date;
  endDate?: Date;
  allDay?: boolean;
  location?: string;
  attendees?: mongoose.Types.ObjectId[];
  color?: string;
  reminder?: boolean;
  reminderMinutes?: number;
  createdBy: mongoose.Types.ObjectId;
  companyId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CalendarEventSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['meeting', 'task', 'reminder', 'event', 'holiday'], default: 'event' },
  startDate: { type: Date, required: true },
  endDate: Date,
  allDay: { type: Boolean, default: false },
  location: String,
  attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  color: { type: String, default: '#6c5ce7' },
  reminder: { type: Boolean, default: false },
  reminderMinutes: { type: Number, default: 30 },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: String, required: true, index: true },
}, { timestamps: true });

export default mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>('CalendarEvent', CalendarEventSchema);
