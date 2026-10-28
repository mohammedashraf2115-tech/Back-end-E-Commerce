const User = require('../model/user.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');

exports.getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: req.user
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    const { name, mobile } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (mobile !== undefined) updates.mobile = mobile;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: updatedUser
    });
});

exports.addAddress = catchAsync(async (req, res, next) => {
    const { title, street, city, isDefault } = req.body;
    const user = req.user;

    const shouldBeDefault = user.addresses.length === 0 || isDefault === true;

    if (shouldBeDefault) {
        user.addresses.forEach(addr => (addr.isDefault = false));
    }

    user.addresses.push({
        title,
        street,
        city,
        isDefault: shouldBeDefault
    });

    await user.save();

    res.status(201).json({
        status: 'success',
        message: 'Address added successfully',
        data: user.addresses
    });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    const { title, street, city, isDefault } = req.body;
    const user = req.user;

    const address = user.addresses.id(addressId);
    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    if (title) address.title = title;
    if (street) address.street = street;
    if (city) address.city = city;

    if (isDefault === true) {
        user.addresses.forEach(addr => (addr.isDefault = false));
        address.isDefault = true;
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address updated successfully',
        data: user.addresses
    });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    const user = req.user;

    const address = user.addresses.id(addressId);
    if (!address) {
        return next(new AppError('Address not found', 404));
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Address deleted successfully',
        data: user.addresses
    });
});

exports.setDefaultAddress = catchAsync(async (req, res, next) => {
    const { addressId } = req.params;
    const user = req.user;

    const targetAddress = user.addresses.id(addressId);
    if (!targetAddress) {
        return next(new AppError('Address not found', 404));
    }

    user.addresses.forEach(addr => {
        addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();

    res.status(200).json({
        status: 'success',
        message: 'Default address updated successfully',
        data: user.addresses
    });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find().select('-password');
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: users
    });
});

exports.toggleBlockUser = catchAsync(async (req, res, next) => {
    const { userId } = req.params;

    if (req.user._id.toString() === userId) {
        return next(new AppError('You cannot block your own account', 400));
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
        return next(new AppError('User not found', 404));
    }

    targetUser.isBlocked = !targetUser.isBlocked;
    await targetUser.save();

    res.status(200).json({
        status: 'success',
        message: `User ${targetUser.isBlocked ? 'blocked' : 'unblocked'} successfully`,
        data: {
            id: targetUser._id,
            email: targetUser.email,
            isBlocked: targetUser.isBlocked
        }
    });
});

exports.createAdmin = catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    const newAdmin = await User.create({
        name,
        email,
        password,
        role: 'admin'
    });

    res.status(201).json({
        status: 'success',
        message: 'New admin account created successfully',
        data: {
            id: newAdmin._id,
            name: newAdmin.name,
            email: newAdmin.email,
            role: newAdmin.role
        }
    });
});
