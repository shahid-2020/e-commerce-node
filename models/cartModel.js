const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    productId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    variationId: {
      type: mongoose.Types.ObjectId,
      ref: 'Variation',
    },
    quantity: {
      type: Number,
      default: 1,
    },
    ownerId: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: 'User',
      },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', schema);
