require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');

const mongoose = require('./db/mongoose');
const redis = require('./db/redis');

const errorMiddleware = require('./middlewares/errorMiddleware');

const authController = require('./controllers/authController');
const userController = require('./controllers/userController');
const addressController = require('./controllers/addressController');
const cartController = require('./controllers/cartController');
const productController = require('./controllers/productController');
const productImageController = require('./controllers/productImageController');
const variationController = require('./controllers/variationController');
const orderController = require('./controllers/orderController');

process.on('SIGINT', async () => {
  redis.quit();
  await mongoose.connection.close();
  process.exit(0);
});

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(xss());
app.use(mongoSanitize());
app.use(hpp({ whitelist: [] }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

const authLimiter = rateLimit({
  max: 10,
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests!',
});

const limiter = rateLimit({
  max: 2000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests!, please try again in an hour!',
});

app.use('/api/v1/auth', authLimiter, authController);
app.use(limiter);
app.use('/api/v1/user', userController);
app.use('/api/v1/address', addressController);
app.use('/api/v1/cart', cartController);
app.use('/api/v1/product', productController);
app.use('/api/v1/product/image', productImageController);
app.use('/api/v1/product/variation', variationController);
app.use('/api/v1/order', orderController);

app.use([errorMiddleware.defaultError, errorMiddleware.processError]);

app.listen(process.env.PORT);
