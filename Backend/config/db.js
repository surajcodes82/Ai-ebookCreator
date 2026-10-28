const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/ai-ebook-creator';

const connectDB = async () => {
  // Render (and most hosts) can't reach a local MongoDB instance, so never fall
  // back to localhost when deployed.
  const isHosted =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RENDER) ||
    Boolean(process.env.RENDER_EXTERNAL_URL);
  const uri = process.env.MONGO_URI || (isHosted ? '' : LOCAL_URI);

  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Add a MongoDB Atlas connection string to your environment variables.'
    );
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    const target = uri.replace(/\/\/[^@]*@/, '//***@');
    throw new Error(`Could not connect to MongoDB at ${target}. ${error.message}`);
  }

  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};

module.exports = connectDB;
