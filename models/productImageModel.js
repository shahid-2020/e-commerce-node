const mongoose = require('mongoose');

const { Schema } = mongoose;

const schema = new Schema(
  {
    image: { type: Buffer },
    ownerId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
  },
  { timestamp: true }
);

module.exports = mongoose.model('ProductImage', schema);
