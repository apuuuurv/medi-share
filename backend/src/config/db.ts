import mongoose from 'mongoose';
import dns from 'dns';

// Force Node.js DNS lookup to use Google Public DNS (Fixes ECONNREFUSED)
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is missing in environment variables.');
    }
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB Atlas Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${(error as Error).message}`);
    process.exit(1);
  }
};