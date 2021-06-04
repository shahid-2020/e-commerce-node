const express = require('express');
const httpError = require('http-errors');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/userModel');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const util = require('../utils/util');
const helper = require('../utils/helper');

const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 10485760,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'));
    }
    return cb(null, true);
  },
});

router.get('/me', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    await req.user.populate('addresses').populate('cart').execPopulate();
    res.status(200).send({ status: 'success', data: { user: req.user } });
  } catch (error) {
    next(error);
  }
});

router.patch('/me', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    const allowedUpdates = ['name', 'email', 'phoneNumber', 'password'];
    const validUpdate = util.validUpdate(allowedUpdates, req.body);
    if (!validUpdate) {
      throw httpError.BadRequest();
    }
    const { user } = req;
    const updates = Object.keys(req.body);
    updates.forEach((update) => {
      user[update] = req.body[update];
    });
    const updatedUser = await user.save();
    res.status(200).send({ status: 'success', data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
});

router.delete('/me', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    await req.user.remove();
    helper.logout(req, res, next);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/me/avatar',
  authorizeMiddleware.authorize,
  async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id);
      if (!user.avatar) {
        res.status(204).send(); 
        return;
      }
      res.set('Content-Type', 'img/jpeg');
      res.status(200).send(user.avatar);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/me/avatar',
  authorizeMiddleware.authorize,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw httpError.BadRequest();
      }
      req.user.avatar = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 })
        .jpeg()
        .toBuffer();
      await req.user.save();
      res.status(200).send({ status: 'success', message: 'Request succeeded' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/me/avatar',
  authorizeMiddleware.authorize,
  async (req, res, next) => {
    try {
      req.user.avatar = undefined;
      await req.user.save();
      res.status(200).send({ status: 'success', message: 'Request succeeded' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
