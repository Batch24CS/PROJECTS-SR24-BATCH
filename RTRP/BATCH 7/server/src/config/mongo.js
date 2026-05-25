const mongoose = require("mongoose");

let connectionPromise = null;

function connectMongo() {
  if (!process.env.MONGODB_URI) {
    console.log("MONGODB_URI not set. Using local JSON store fallback.");
    return null;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB || "edureach_college_portal",
      })
      .then(() => {
        console.log("MongoDB connected");
        return mongoose.connection;
      })
      .catch((error) => {
        console.error("MongoDB connection failed. JSON fallback remains available.", error.message);
        connectionPromise = null;
        return null;
      });
  }

  return connectionPromise;
}

module.exports = { connectMongo };
