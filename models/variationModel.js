const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema({
  variationType: {
    type: String,
    required: true,
    maxlength: 15,
    trim: true,
    lowercase: true,
  },
  variants: [
    {
      type: String,
      required: true,
      maxlength: 15,
      trim: true,
      lowercase: true,
    },
  ],
  ownerId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: 'Product',
  },
});

module.exports = mongoose.model('Variation', schema);
