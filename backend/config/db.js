import mongoose from "mongoose";
import { env } from "./env.js";

const uri = env.MONGODB_URI || process.env.MONGO_URI;

const connectDB = async () => {
  if (!uri) {
    console.error("MongoDB connection error: MONGODB_URI is not set. Add it to project root `.env`.");
    process.exit(1);
  }
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    if (/bad auth|authentication failed/i.test(String(err.message))) {
      console.error(
        "Hint: Atlas → Database Access: username/password must match this URI exactly. Special chars in password must be URL-encoded (@ → %40). Create a DB user on this cluster if none exists."
      );
    }
    if (/querySrv|ECONNREFUSED/i.test(String(err.message))) {
      console.error(
        "Hint: `mongodb+srv` needs working DNS. Use a standard `mongodb://host1:27017,host2:27017,...` URI from Atlas Connect, or set DNS to 8.8.8.8."
      );
    }
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => console.log("MongoDB disconnected"));
mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));

export default connectDB;
