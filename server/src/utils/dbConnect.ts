import mongoose from 'mongoose';

// Cached connection to reuse across function invocations
let cachedConnection: typeof mongoose | null = null;

export async function connectToDatabase() {
  // If we have a cached connection, return it
  if (cachedConnection) {
    return cachedConnection;
  }

  // Ensure we have a MongoDB URI
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
  }

  try {
    // Connect to MongoDB with connection options
    const connection = await mongoose.connect(MONGODB_URI, {
      // Recommended options for serverless environments
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });

    // Cache the connection
    cachedConnection = connection;

    console.log('✅ Successfully connected to MongoDB');
    return connection;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    throw error;
  }
}

// Graceful shutdown for serverless environments
export async function disconnectFromDatabase() {
  if (cachedConnection) {
    await cachedConnection.disconnect();
    cachedConnection = null;
    console.log('🔌 Disconnected from MongoDB');
  }
} 