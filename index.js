const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

const { conectDB } = require('./config/db.config');
const AppError = require('./utilites/appError.util');
const corsMiddleware = require('./middlewares/cors.middleware');
const errorHandler = require('./middlewares/errorHandler.middleware');

conectDB();

app.use(helmet({
    crossOriginResourcePolicy: false
}));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: { status: 'fail', message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api', globalLimiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { status: 'fail', message: 'Too many login/register attempts, please try again after 15 minutes' }
});
app.use('/api/v1/auth', authLimiter);

app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' }));

app.use('/files', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1/auth', require('./route/auth.route'));
app.use('/api/v1/user', require('./route/user.route'));
app.use('/api/v1/product', require('./route/product.route'));
app.use('/api/v1/category', require('./route/category.route'));
app.use('/api/v1/cart', require('./route/cart.route'));
app.use('/api/v1/order', require('./route/order.route'));
app.use('/api/v1/testimonial', require('./route/testimonial.route'));
app.use('/api/v1/faq', require('./route/faq.route'));
app.use('/api/v1/page', require('./route/page.route'));
app.use('/api/v1/admin', require('./route/admin.route'));
app.use('/api/v1/dashboard', require('./route/dashboard.route'));

app.use((req, res, next) => {
    next(new AppError(`Can't find "${req.originalUrl}"`, 404));
});

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started at port ${port}`));
