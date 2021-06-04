const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const httpError = require('http-errors');
const Product = require('./productModel');
const Address = require('./addressModel');
const Cart = require('./cartModel');

const { Schema } = mongoose;
const schema = new Schema(
  {
    avatar: {
      type: Buffer,
    },
    name: {
      type: String,
      required: true,
      maxlength: 50,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
      lowercase: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 10,
      validate(value) {
        if (!validator.isMobilePhone(value)) {
          throw new Error('Invalid Phone Number');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    addresses: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'Address' }],
    },
    cart: {
      type: [{ type: mongoose.Types.ObjectId, ref: 'Cart' }],
    },
    status: {
      type: String,
      enums: ['active', 'hold', 'block'],
      default: 'active',
    },
    roles: {
      type: [String],
      enum: ['user', 'seller', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

schema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'ownerId',
});

schema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) {
    throw httpError.NotFound();
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw httpError.NotFound();
  }

  return user;
};

schema.methods.generateToken = async function (secret, expiry) {
  try {
    const payload = { _id: this._id.toString() };
    const options = {
      expiresIn: expiry,
    };
    const token = await jwt.sign(payload, secret, options);
    return token;
  } catch (error) {
    throw httpError.InternalServerError();
  }
};

schema.methods.generateAccessToken = async function () {
  const token = await this.generateToken(
    process.env.ACCESS_TOKEN_SECRET,
    `${process.env.ACCESS_TOKEN_SECRET_EXPIRES_HRS}h`
  );
  return token;
};

schema.methods.generateRefreshToken = async function () {
  const token = await this.generateToken(
    process.env.REFRESH_TOKEN_SECRET,
    `${process.env.REFRESH_TOKEN_SECRET_EXPIRES_HRS}h`
  );
  return token;
};

schema.methods.generateResetPasswordToken = async function () {
  const token = await this.generateToken(
    process.env.RESET_PASSWORD_TOKEN_SECRET,
    `${process.env.RESET_PASSWORD_TOKEN_SECRET_EXPIRES_HRS * 60}m`
  );
  return token;
};

schema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.avatar;
  delete user.status;
  delete user.password;
  return user;
};

schema.pre('save', async function (next) {
  try {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 8);
    }
  } catch (error) {
    next(error);
  }
});

schema.pre('remove', async function (next) {
  try {
    await Address.deleteMany({ ownerId: this._id });
    await Cart.deleteMany({ ownerId: this._id });
    const products = await Product.find({ ownerId: this._id });
    products.forEach(async (product) => {
      await product.remove();
    });
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', schema);
