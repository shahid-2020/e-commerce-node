const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios').default;
const httpError = require('http-errors');
const Address = require('../models/addressModel');
const authorizeMiddleware = require('../middlewares/authorizeMiddleware');

const router = express.Router();
router.get('/', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    const addresses = await Address.find({ ownerId: req.user._id });
    res.status(200).send({ status: 'success', data: { addresses } });
  } catch (error) {
    next(error);
  }
});

router.get('/postalpincode/:postalCode', async (req, res, next) => {
  try {
    const { postalCode } = req.params;
    if (postalCode.length !== 6) {
      throw httpError.BadRequest('Invalid postal code');
    }
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${postalCode}`
    );
    res.status(200).send({
      status: response.data[0].Status.toLowerCase(),
      data: { postOffice: response.data[0].PostOffice },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authorizeMiddleware.authorize, async (req, res, next) => {
  try {
    const address = new Address(req.body);
    address.ownerId = req.user._id;
    req.user.addresses.push(address._id);
    await address.save();
    await req.user.save();
    res.status(200).send({ status: 'success', data: { address } });
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:addressId',
  authorizeMiddleware.authorize,
  async (req, res, next) => {
    try {
      const { addressId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        throw httpError.BadRequest('Invalid address id!');
      }
      const address = await Address.findOneAndUpdate(
        {
          _id: addressId,
          ownerId: req.user._id,
        },
        req.body,
        { new: true, runValidators: true }
      );
      if (!address) {
        throw httpError.NotFound();
      }
      res.status(200).send({ status: 'success', data: { address } });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:addressId',
  authorizeMiddleware.authorize,
  async (req, res, next) => {
    try {
      const { addressId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(addressId)) {
        throw httpError.BadRequest('Invalid address id!');
      }
      const address = await Address.findOneAndDelete({
        _id: addressId,
        ownerId: req.user._id,
      });
      req.user.addresses.pull(address._id);
      await req.user.save();
      res.status(200).send({ status: 'success', data: { address } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
