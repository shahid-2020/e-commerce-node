const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    line1: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    line2: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    postalCode: {
      type: Number,
      required: true,
    },
    postOffice: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    district: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    state: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    country: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
    },
    addressOf: {
      type: String,
      required: true,
      enums: ['home', 'work', 'other'],
    },
    ownerId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Address', schema);
