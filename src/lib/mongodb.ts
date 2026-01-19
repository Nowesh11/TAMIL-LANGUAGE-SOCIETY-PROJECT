import mongoose from 'mongoose';

// Manually ensure MONGODB_URI is available if process.env isn't populated yet
// This is a failsafe for scripts running via tsx where env vars might not propagate automatically to imported modules
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tamil-language-society';

// Don't throw error if not defined, let it fail at connection time if needed
// This prevents build/script failures when env vars are not loaded in that specific context
// but provided elsewhere (e.g. Docker, Vercel)
if (!MONGODB_URI && process.env.NODE_ENV !== 'production' && !process.env.NEXT_RUNTIME) {
  // Only warn in non-production/non-runtime environments (like scripts)
  console.warn('⚠️ MONGODB_URI is not defined in environment variables');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('🔌 Connecting to MongoDB:', MONGODB_URI?.substring(0, 20) + '...');
    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;