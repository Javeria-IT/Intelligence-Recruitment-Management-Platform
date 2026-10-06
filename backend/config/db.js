// config/db.js
// Establishes and exports the MongoDB connection using Mongoose.

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Exit process with failure since the app cannot function without a DB
    process.exit(1);
  }
};

module.exports = connectDB;
