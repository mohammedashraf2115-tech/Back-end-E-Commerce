const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');

const signinToken = (myUser) => {
    const { _id, role, name } = myUser;
    return jwt.sign(
        { _id, role, name },
        process.env.SECRET_KEY,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};


exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;


    const newUser = await User.create({
        name,
        email,
        password,
        role: 'user'
    });

    const token = signinToken(newUser);

    res.status(201).json({
        status: 'success',
        message: 'Account created successfully',
        data: {
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        }
    });
});


exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }


    const myUser = await User.findOne({ email }).select('+password');

    if (!myUser || !(await myUser.isCorrectPassword(password))) {
        return next(new AppError('Unauthorized: Invalid email or password', 401));
    }

    if (myUser.isBlocked) {
        return next(new AppError('Your account has been blocked. Please contact support.', 403));
    }

    const token = signinToken(myUser);

    res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        data: {
            token,
            user: {
                id: myUser._id,
                name: myUser.name,
                email: myUser.email,
                role: myUser.role
            }
        }
    });
});

