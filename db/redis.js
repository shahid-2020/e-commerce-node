/* eslint-disable no-console */
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_DB_URI,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

client.on('connect', function () {
  console.log('Redis connected');
});

client.on('ready', function () {
  console.log('Redis ready');
});

client.on('end', function () {
  console.log('Redis disconnected');
});

client.on('error', function (error) {
  console.log('Redis error', error);
});

module.exports = client;
