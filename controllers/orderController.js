/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable radix */
const express = require('express');
const mongoose = require('mongoose');
const httpError = require('http-errors');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');
const util = require('../utils/util');

const router = express.Router();

router.get('/', authorizeMiddleware.authorize, async (req, res, next) => {
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
    match.client = req.user._id;
    const orders = await Order.find(match)
      .populate('address')
      .populate('product')
      .populate('variation')
      .skip(skip)
      .limit(limit)
      .sort(sort);
    res.status(200).send({ status: 'success', data: { orders } });
  } catch (error) {
    next(error);
  }
});

router.get(
  '/seller',
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
      match.seller = req.user._id;
      const orders = await Order.find(match)
        .populate('client', 'name email phoneNumber')
        .populate('address')
        .populate('product')
        .populate('variation')
        .skip(skip)
        .limit(limit)
        .sort(sort);

      res.status(200).send({ status: 'success', data: { orders } });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    const { paymentMode, address, cartItems } = req.body;
    if (!req.user.addresses.includes(address)) {
      throw httpError.BadRequest('Invalid address');
    }

    const orders = [];
    for (const item of cartItems) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isAvailable) {
        throw httpError.NotFound('Product not available!');
      }

      if (product.variations.length > 0 && !item.variationId) {
        throw httpError.BadRequest('Product variation is required');
      }
      const obj = {
        client: req.user._id,
        seller: product.ownerId,
        product: item.productId,
        variation: item.variationId,
        quantity: item.quantity,
        total: product.sellingPrice * item.quantity,
        paymentMode,
        address,
      };
      const order = new Order(obj);
      await order.save();
      await Cart.deleteOne({ _id: item._id });
      orders.push(order);
    }

    res.status(201).send({ status: 'success', data: orders });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:orderId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw httpError.BadRequest('Invalid order id!');
      }
      const allowedUpdates = ['trackingId', 'orderStatus'];
      const validUpdate = util.validUpdate(allowedUpdates, req.body);
      if (!validUpdate) {
        throw httpError.BadRequest();
      }
      const order = await Order.findOneAndUpdate(
        {
          _id: orderId,
          sellerId: req.user._id,
        },
        req.body,
        { new: true, runValidators: true }
      );
      if (!order) {
        throw httpError.NotFound();
      }
      res.status(200).send({ status: 'success', data: { order } });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:orderId',
  authorizeMiddleware.authorize,
  authorizeMiddleware.authorizeSeller,
  async (req, res, next) => {
    try {
      const { orderId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw httpError.BadRequest('Invalid order id!');
      }

      const order = await Order.findOneAndDelete({
        _id: orderId,
        sellerId: req.user._id,
      });
      if (!order) {
        throw httpError.NotFound();
      }
      res.status(200).send({ status: 'success', data: { order } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
