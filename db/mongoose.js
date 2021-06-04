/* eslint-disable no-console */
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_DB_URI, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
mongoose.connection.on('error', (err) => {
  console.log('MongoDB error', err);
});

module.exports = mongoose;
