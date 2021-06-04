const { promisify } = require('util');
const client = require('../db/redis');

class Cache {
  constructor(_client, _promisify) {
    this._client = _client;
    this._promisify = _promisify;
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
    this.del = this.del.bind(this);
  }

  async set(key, value, expiryInHr) {
    if (!key || !value || !expiryInHr) {
      throw new Error('CacheModel Error: Missing Parameters');
    }
    const setCache = this._promisify(this._client.SET).bind(this._client);
    const expiryInS = expiryInHr * 60 * 60;
    await setCache(key, value, 'EX', expiryInS);
    return true;
  }

  async get(key) {
    if (!key) {
      throw new Error('CacheModel Error: Missing Parameters');
    }
    const getCache = this._promisify(this._client.GET).bind(this._client);
    const value = await getCache(key);
    return value;
  }

  async del(key) {
    if (!key) {
      throw new Error('CacheModel Error: Missing Parameters');
    }
    const delCache = this._promisify(this._client.DEL).bind(this._client);
    await delCache(key);
    return true;
  }
}
module.exports = new Cache(client, promisify);
