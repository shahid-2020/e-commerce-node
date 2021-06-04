const mongoose = require('mongoose');
const Variation = require('./variationModel');
const ProductImage = require('./productImageModel');

const { Schema } = mongoose;

const schema = new Schema(
  {
    images: [{ type: mongoose.ObjectId, ref: 'ProductImage' }],
    name: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    brand: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
      enums: [
        'grocery',
        'health',
        'appliance',
        'electronic',
        'stationary',
        'beauty',
      ],
    },
    subCategory: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    expiry: {
      type: Date,
    },
    currency: {
      type: String,
      required: true,
      trim: true,
      enums: ['INR'],
      default: 'INR',
    },
    markedPrice: {
      type: Number,
      required: true,
      trim: true,
      validate(value) {
        if (value <= 0) {
          throw new Error('Invalid Price');
        }
      },
    },
    sellingPrice: {
      type: Number,
      required: true,
      trim: true,
      validate(value) {
        if (value <= 0) {
          throw new Error('Invalid Price');
        }
      },
    },
    isAvailable: {
      type: Boolean,
      required: true,
      default: true,
    },
    seller: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    variations: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'Variation' }],
    },
    ownerId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamp: true }
);

schema.pre('remove', async function (next) {
  try {
    await Variation.deleteMany({ ownerId: this._id });
    await ProductImage.deleteMany({ ownerId: this._id });
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Product', schema);
