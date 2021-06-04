const express = require('express');
const mongoose = require('mongoose');
const httpError = require('http-errors');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const Product = require('../models/productModel');
const Variation = require('../models/variationModel');

const router = express.Router();

router.post(
  '/:productId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { productId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw httpError.BadRequest('Invalid product id!');
      }

      const product = await Product.find({
        _id: productId,
        ownerId: req.user._id,
      });

      if (!product) {
        throw httpError.NotFound("Product dosen't exists");
      }

      const { variationType, variants } = req.body;
      const ownerId = product._id;
      if (!variationType || !variants || !Array.isArray(variants)) {
        throw httpError.BadRequest();
      }
      const exist = await Variation.findOne({ ownerId, variationType });
      if (exist) {
        throw httpError.BadRequest('Variation already exists!');
      }
      const variation = new Variation({
        variationType,
        variants: [...new Set(variants)],
        ownerId,
      });
      product.variations.push(variation._id);
      await product.save({ validateBeforeSave: false });
      await variation.save();
      res.status(200).send({ status: 'success', data: { variation } });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:variationId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { variationId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(variationId)) {
        throw httpError.BadRequest('Invalid variation id!');
      }
      const { variationType, addVariants, delVariants } = req.body;

      const variationObj = await Variation.findById(variationId);

      if (!variationObj) {
        throw httpError.NotFound();
      }

      const product = Product.findById(variationObj.owerId);

      if (product.ownerId !== req.user._id) {
        throw httpError.NotFound();
      }

      if (variationType) {
        variationObj.variationType = variationType;
      }

      if (addVariants && Array.isArray(addVariants)) {
        variationObj.variants.addToSet(...addVariants);
      }

      if (delVariants && Array.isArray(delVariants)) {
        variationObj.variants.pull(...delVariants);
      }
      await variationObj.save();
      res.status(200).send({ status: 'success', data: { variationObj } });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:variationId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { variationId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(variationId)) {
        throw httpError.BadRequest('Invalid variation id!');
      }
      const variation = await Variation.findById(variationId);
      const product = await Product.findById(variation.ownerId);
      if (product.ownerId !== req.user._id) {
        throw httpError.NotFound();
      }
      product.variations.pull(variation._id);
      await variation.remove();
      await product.save({ validateBeforeSave: false });
      res.status(200).send({ status: 'success', data: { product } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
