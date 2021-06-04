/* eslint-disable radix */
const express = require('express');
const mongoose = require('mongoose');
const httpError = require('http-errors');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const Product = require('../models/productModel');
const Variation = require('../models/variationModel');
const ProductImage = require('../models/productImageModel');
const util = require('../utils/util');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const match = {};
    const sort = {};
    const skip = parseInt(req.query.skip) || 0;
    const limit = parseInt(req.query.limit) || 20;
    if (req.query.query && req.query.value) {
      match[req.query.query] = req.query.value.toLowerCase();
    }

    if (req.query.sortBy) {
      const [field, order] = req.query.sortBy.split('_');
      sort[field] = order;
    }
    const products = await Product.find(match)
      .populate('variations')
      .skip(skip)
      .limit(limit)
      .sort(sort);
    res.status(200).send({ status: 'success', data: { products } });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/myProducts',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const match = {};
      const sort = {};
      const skip = parseInt(req.query.skip) || 0;
      const limit = parseInt(req.query.limit) || 20;
      if (req.query.query && req.query.value) {
        match[req.query.query] = req.query.value.toLowerCase();
      }

      if (req.query.sortBy) {
        const [field, order] = req.query.sortBy.split('_');
        sort[field] = order;
      }
      await req.user
        .populate({
          path: 'products',
          match,
          options: {
            limit,
            skip,
            sort,
          },
        })
        .execPopulate();
      res
        .status(200)
        .send({ status: 'success', data: { products: req.user.products } });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw httpError.BadRequest('Invalid product id!');
    }
    const product = await Product.findById(productId).populate('variations');
    res.status(200).send({
      status: 'success',
      data: { product },
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  '/',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const product = new Product({ ...req.body, variations: undefined });
      product.ownerId = req.user._id;
      product.seller = req.user.email;
      if (req.body.variations) {
        req.body.variations.forEach(async (variation) => {
          const variationObj = new Variation({
            ...variation,
            variants: [...new Set(variation.variants)],
            ownerId: product._id,
          });
          product.variations.push(variationObj._id);
          await variationObj.save();
        });
      }
      await product.save();
      res.status(200).send({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:productId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw httpError.BadRequest('Invalid product id!');
      }
      const allowedUpdates = [
        'name',
        'description',
        'brand',
        'category',
        'subCategory',
        'expiry',
        'currency',
        'markedPrice',
        'sellingPrice',
        'isAvailable',
      ];
      const validUpdate = util.validUpdate(allowedUpdates, req.body);
      if (!validUpdate) {
        throw httpError.BadRequest();
      }
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          ownerId: req.user._id,
        },
        req.body,
        { new: true, runValidators: true }
      );

      if (!product) {
        throw httpError.NotFound();
      }
      res.status(200).send({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:productId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw httpError.BadRequest('Invalid product id!');
      }
      const product = await Product.deleteOne({
        _id: productId,
        ownerId: req.user._id,
      });
      if (product) {
        throw httpError.NotFound();
      }
      await Variation.deleteMany({ ownerId: productId });
      await ProductImage.deleteMany({ ownerId: productId });

      res.status(200).send({ status: 'success', message: 'Request succeeded' });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
