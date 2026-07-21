import mongoose from 'mongoose';
import { ReadPreference } from 'mongodb';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    // Connection pool optimized for 1000+ concurrent users
    const opts = {
      bufferCommands: false,
      maxPoolSize: 100,          // Max connections in pool
      minPoolSize: 10,           // Min connections to keep alive
      maxIdleTimeMS: 60000,      // Close idle connections after 60s
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000,    // Close sockets after 45s of inactivity
      connectTimeoutMS: 10000,   // Timeout for initial connection
      retryWrites: true,         // Retry failed writes
      retryReads: true,          // Retry failed reads
      // Replica set awareness for production
      readPreference: ReadPreference.SECONDARY_PREFERRED,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB connection error:', error);
      cached!.promise = null;
      throw error;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;
