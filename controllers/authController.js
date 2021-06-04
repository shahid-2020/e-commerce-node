const express = require('express');
const jwt = require('jsonwebtoken');
const httpError = require('http-errors');
const mail = require('../mail/mail.js');
const User = require('../models/userModel');
const cache = require('../utils/cache');
const helper = require('../utils/helper');

const router = express.Router();

const cookieExpiry = (exp) => (new Date(Date.now() + exp * 60 * 60 * 1000))

const cookieOption = (exp) => {
  const option = {
    expires: cookieExpiry(exp),
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  };
  return option;
};

router.post('/register', async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send({ status: 'success', message: 'Request succeeded' });
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      error.status = 422;
      error.message = error._message || error.name;
    }
    next(error);
  }
});

router.post('/registerSeller', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw httpError.BadRequest();
    }
    const user = await User.findByCredentials(email, password);
    if (!user) {
      throw httpError.NotFound('User not registered');
    }
    if (user.roles.includes('seller')) {
      throw httpError.BadRequest('Already a seller account!');
    }
    user.roles.push('seller');
    await user.save();
    res.status(201).send({ status: 'success', message: 'Request succeeded' });
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      error.status = 422;
    }
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw httpError.BadRequest();
    }
    const user = await User.findByCredentials(email, password);
    if (!user) {
      throw httpError.NotFound();
    }
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    await cache.set(
      user._id.toString(),
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET_EXPIRES_HRS
    );
    res.cookie(
      'loggedIn',
      'yes',
      {expires: cookieExpiry(process.env.ACCESS_TOKEN_SECRET_EXPIRES_HRS)}
    );

    res.cookie(
      'accessToken',
      accessToken,
      cookieOption(process.env.ACCESS_TOKEN_SECRET_EXPIRES_HRS)
    );
    res.cookie(
      'refreshToken',
      refreshToken,
      cookieOption(process.env.REFRESH_TOKEN_SECRET_EXPIRES_HRS)
    );
    res.status(200).send({ status: 'success', message: 'Request succeeded' });
  } catch (error) {
    next(error);
  }
});

router.post('/refreshToken', async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      throw httpError.BadRequest();
    }
    const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const cachedToken = await cache.get(payload._id);
    if (refreshToken !== cachedToken) {
      throw httpError.Unauthorized();
    }
    const user = await User.findById(payload._id);
    if (!user) {
      throw httpError.NotFound();
    }
    const accessToken = await user.generateAccessToken();
    res.cookie(
      'accessToken',
      accessToken,
      cookieOption(process.env.ACCESS_TOKEN_SECRET_EXPIRES_HRS)
    );

    res.status(200).send({ status: 'success', message: 'Request succeeded' });
  } catch (error) {
    next(error);
  }
});

router.delete('/logout', async (req, res, next) => {
  helper.logout(req, res, next);
});

router.post('/forgotPassword', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw httpError.BadRequest();
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw httpError.NotFound();
    }
    const token = await user.generateResetPasswordToken();
    const uri = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/auth/resetPassword/${token}`;
    await mail.sendResetPasswordMail(user.email, uri);
    res.status(200).send({ status: 'success', message: 'Request succeeded' });
  } catch (error) {
    next(error);
  }
});

router.patch('/resetPassword/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!token || !password) {
      throw httpError.BadRequest();
    }
    const payload = jwt.verify(token, process.env.RESET_PASSWORD_TOKEN_SECRET);
    const user = await User.findById(payload._id);
    if (!user) {
      throw httpError.Unauthorized();
    }
    user.password = password;
    user.save();
    res.status(200).send({ status: 'success', message: 'Request succeeded' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
