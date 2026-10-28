const logger = require('../utilites/logger.util');
const AppError = require('../utilites/appError.util');

module.exports = (err, req, res, next) => {
    logger.error(err.message);

    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
            status: 'fail',
            message: `${field} already exists`,
        });
    }

    if (process.env.NODE_ENV === 'development') {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack,
        });
    }

    // Production
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }

    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong',
    });
};
