const AppError = require('../utilites/appError.util');

exports.authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return next(new AppError('Access denied: You do not have permission to perform this action', 403));
        }
        next();
    };
};

