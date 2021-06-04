const jwt = require('jsonwebtoken');
const httpError = require('http-errors');
const cache = require('./cache');

class Helper {
  constructor(_cache, _jwt, _httpError) {
    this._cache = _cache;
    this._jwt = _jwt;
    this._httpError = _httpError;
    this.logout = this.logout.bind(this);
  }

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.cookies;
      if (!refreshToken) {
        throw this._httpError.BadRequest();
      }
      const payload = this._jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      );
      await this._cache.del(payload._id);
      res.clearCookie('loggedIn');
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      res.status(200).send({ status: 'success', message: 'Request succeeded' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new Helper(cache, jwt, httpError);
