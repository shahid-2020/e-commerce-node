const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    client: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    address: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'Address',
    },
    seller: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    product: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    variation: {
      type: mongoose.Types.ObjectId,
      ref: 'Variation',
    },
    quantity: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      required: true,
      enums: ['online', 'cod'],
    },
    paymentId: {
      type: String,
      required: true,
      default: 'not available',
    },
    trackingId: {
      type: String,
      required: true,
      default: 'not available',
    },
    orderStatus: {
      type: String,
      required: true,
      enums: ['confirmed', 'rejected', 'canceled', 'shipped', 'delivered'],
      default: 'confirmed',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', schema);
