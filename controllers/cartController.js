const express = require('express');
const mongoose = require('mongoose');
const httpError = require('http-errors');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();

router.get('/', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    const cartItems = await Cart.find({ ownerId: req.user._id });
    res.status(200).send({ status: 'success', data: { cartItems } });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    const exist = await Cart.find({
      productId: req.body.productId,
      ownerId: req.user._id,
    });

    if (exist.length > 0) {
      throw httpError.BadRequest('Item already exist in cart!');
    }

    const product = await Product.findById(req.body.productId);
    if (!product) {
      throw httpError.NotFound("Product dosen't exists!");
    }

    if (
      product.variations.length > 0 &&
      !product.variations.includes(req.body.variationId)
    ) {
      throw httpError.BadRequest('Product variation is required');
    }

    const cartItem = new Cart(req.body);
    cartItem.ownerId = req.user._id;
    req.user.cart.push(cartItem._id);
    await cartItem.save();
    await req.user.save();
    res.status(200).send({ status: 'success', data: { cartItem } });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:cartItemId',
  authorizeMiddleware.authorize,
  async (req, res, next) => {
    try {
      const { cartItemId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
        throw httpError.BadRequest('Invalid cart item id!');
      }
      const cartItem = await Cart.findOneAndUpdate(
        {
          _id: cartItemId,
          ownerId: req.user._id,
        },
        { quantity: req.body.value },
        { new: true, runValidators: true }
      );
      if (!cartItem) {
        throw httpError.NotFound();
      }
      res.status(200).send({ status: 'success', data: { cartItem } });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:cartItemId',
  authorizeMiddleware.authorize,
  async (req, res, next) => {
    try {
      const { cartItemId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(cartItemId)) {
        throw httpError.BadRequest('Invalid cart item id!');
      }
      const cartItem = await Cart.findOneAndDelete({
        _id: cartItemId,
        ownerId: req.user._id,
      });
      req.user.cart.pull(cartItem._id);
      await req.user.save();
      res.status(200).send({ status: 'success', data: { cartItem } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
