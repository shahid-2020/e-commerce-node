/* eslint-disable radix */
const express = require('express');
const mongoose = require('mongoose');
const httpError = require('http-errors');
const multer = require('multer');
const sharp = require('sharp');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const Product = require('../models/productModel');
const ProductImage = require('../models/productImageModel');

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

router.get('/:imageId', async (req, res, next) => {
  try {
    const { imageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(imageId)) {
      throw httpError.BadRequest('Invalid image id!');
    }
    const productImage = await ProductImage.findById(imageId);
    if (!productImage) {
      res.status(204).send();
      return;
    }
    res.set('Content-Type', 'img/jpeg');
    res.status(200).send(productImage.image);
  } catch (error) {
    next(error);
  }
});

router.post(
  '/:productId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw httpError.BadRequest('Invalid product id!');
      }

      if (!req.file) {
        throw httpError.BadRequest();
      }
      const product = await Product.findOne({
        _id: productId,
        ownerId: req.user._id,
      });

      if (!product) {
        throw httpError.NotFound();
      }

      const image = await sharp(req.file.buffer)
        .resize({ width: 350, height: 350 })
        .jpeg()
        .toBuffer();

      const productImage = new ProductImage({ image, ownerId: product._id });
      product.images.push(productImage._id);
      await productImage.save();
      await product.save({ validateBeforeSave: false });
      res.status(200).send({ status: 'success', message: 'Request succeeded' });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:imageId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { imageId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(imageId)) {
        throw httpError.BadRequest('Invalid image id!');
      }
      const image = await ProductImage.findById(imageId);
      const product = await Product.findOne({
        _id: image.ownerId,
        ownerId: req.user._id,
      });

      if (!product) {
        throw httpError.NotFound();
      }

      product.images.pull(imageId);
      await product.save({ validateBeforeSave: false });
      await image.remove();
      res.status(200).send({ status: 'success', message: 'Request succeeded' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
