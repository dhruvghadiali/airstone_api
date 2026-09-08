const mongoose = require('mongoose');

async function connect_database() {
  const mongo_uri = process.env.MONGODB_URI;

  if (!mongo_uri) {
    throw new Error('MONGODB_URI is not defined in the environment');
  }

  await mongoose.connect(mongo_uri);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connect_database;
