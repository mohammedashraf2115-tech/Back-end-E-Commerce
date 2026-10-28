const jwt = require('jsonwebtoken');
const User = require('../model/user.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');

exports.authanicate = catchAsync(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new AppError('No token provided. Please log in.', 401));
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return next(new AppError('Invalid or expired token', 401));
    }

    const currentUser = await User.findById(decoded._id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    if (currentUser.isBlocked) {
        return next(new AppError('Your account has been blocked.', 403));
    }

    req.user = currentUser;
    next();
});
