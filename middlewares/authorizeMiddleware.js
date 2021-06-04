const httpError = require('http-errors');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

class AuthorizeMiddleware {
  constructor(_User, _httpError, _jwt) {
    this._User = _User;
    this._httpError = _httpError;
    this._jwt = _jwt;
    this.authorize = this.authorize.bind(this);
    this.authorizeSeller = this.authorizeSeller.bind(this);
  }

  async authorize(req, res, next) {
    try {
      const token =
        req.cookies.accessToken;
      if (!token) {
        throw this._httpError.Unauthorized();
      }
      const payload = this._jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await this._User.findById(payload._id);
      
      if (!user) {
        throw this._httpError.Unauthorized();
      }
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        next(this._httpError.Unauthorized('Token Expired'));
      }
      next(this._httpError.Unauthorized());
    }
  }

  async authorizeSeller(req, res, next) {
    try {
      if(!req.user.roles.includes('seller')){
        throw this._httpError.Unauthorized();
      };
      next();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthorizeMiddleware(User, httpError, jwt);
