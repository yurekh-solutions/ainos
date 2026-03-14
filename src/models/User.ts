import mongoose from 'mongoose';

export interface IUser {
  _id?: string;
  email: string;
  name: string;
  googleId?: string;
  image?: string;
  role: 'admin' | 'user';
  companyId?: string;
  phone?: string;
  address?: string;
  country?: string;
  timezone?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    image: String,
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    companyId: {
      type: String,
      ref: 'Company',
    },
    phone: String,
    address: String,
    country: String,
    timezone: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
