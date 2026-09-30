import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

let cached = globalThis.__mongoose;

if (!cached) {
  cached = globalThis.__mongoose = {
    conn: null,
    promise: null,
  };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((mongooseInstance) => {
        console.log(
          `MongoDB Connected: ${mongooseInstance.connection.host}`
        );

        return mongooseInstance;
      })
      .catch((error) => {
        console.error(
          `MongoDB Connection Error: ${error.message}`
        );

        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

export default connectDB;