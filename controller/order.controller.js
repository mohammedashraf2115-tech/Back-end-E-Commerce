const mongoose = require('mongoose');
const Order = require('../model/order.model');
const Cart = require('../model/cart.model');
const Product = require('../model/product.model');
const User = require('../model/user.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');
const logger = require('../utilites/logger.util');

exports.createOrder = catchAsync(async (req, res, next) => {
    const { addressId, mobile } = req.body;
    const user = await User.findById(req.user._id);

    const contactMobile = mobile || user.mobile;
    if (!contactMobile) {
        return next(new AppError('Phone number is required to place an order', 400));
    }

    if (!user.mobile && mobile) {
        user.mobile = mobile;
        await user.save();
    }

    if (!user.addresses || user.addresses.length === 0) {
        return next(new AppError('Shipping address is required to place an order', 400));
    }

    let selectedAddress;
    if (addressId) {
        selectedAddress = user.addresses.id(addressId);
    } else {
        selectedAddress = user.addresses.find(a => a.isDefault) || user.addresses[0];
    }

    if (!selectedAddress) {
        return next(new AppError('Selected address not found', 404));
    }

    const cart = await Cart.findOne({ userId: user._id }).populate({
        path: 'items.productId',
        select: 'title price image stock isActive isDeleted'
    });

    if (!cart || !cart.items || cart.items.length === 0) {
        return next(new AppError('Your cart is empty', 400));
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const orderItems = [];
        let calculatedTotal = 0;

        for (const item of cart.items) {
            const product = item.productId;

            if (!product || product.isDeleted || !product.isActive) {
                throw new Error(`Product "${product ? product.title : 'Unknown'}" is no longer available`);
            }

            const updatedProduct = await Product.findOneAndUpdate(
                { _id: product._id, stock: { $gte: item.quantity }, isDeleted: false, isActive: true },
                { $inc: { stock: -item.quantity } },
                { new: true, session }
            );

            if (!updatedProduct) {
                throw new Error(`Insufficient stock for product: "${product.title}". Available stock is less than ${item.quantity}`);
            }

            const itemPrice = product.price;
            calculatedTotal += itemPrice * item.quantity;

            orderItems.push({
                productId: product._id,
                title: product.title,
                image: product.image,
                price: itemPrice,
                quantity: item.quantity
            });
        }

        const [newOrder] = await Order.create(
            [
                {
                    userId: user._id,
                    addressId: selectedAddress._id,
                    addressSnapshot: {
                        title: selectedAddress.title,
                        street: selectedAddress.street,
                        city: selectedAddress.city
                    },
                    mobileSnapshot: contactMobile,
                    orderItems,
                    totalPrice: calculatedTotal,
                    status: 'pending',
                    paymentMethod: 'COD',
                    timestamp: Date.now(),
                    date: new Date()
                }
            ],
            { session }
        );

        await Cart.findOneAndUpdate({ userId: user._id }, { items: [] }, { session });

        await session.commitTransaction();
        session.endSession();

        logger.info(`Order created successfully: ${newOrder._id} by user: ${user._id}`);

        res.status(201).json({
            status: 'success',
            message: 'Order placed successfully',
            data: newOrder
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return next(new AppError(err.message, 400));
    }
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: orders
    });
});

exports.getOrderById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const order = await Order.findById(id).populate('userId', 'name email');
    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    const isOwner = order.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
        return next(new AppError('Access denied: You cannot view this order', 403));
    }

    res.status(200).json({
        status: 'success',
        data: order
    });
});

exports.cancelOrderByClient = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId: req.user._id });
    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    if (order.status !== 'pending') {
        return next(new AppError(`Cannot cancel order in "${order.status}" status. Only pending orders can be cancelled.`, 400));
    }

    order.status = 'cancelled by client';
    await order.save();

    for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock: item.quantity }
        });
    }

    logger.info(`Order ${order._id} cancelled by client: ${req.user._id}`);

    res.status(200).json({
        status: 'success',
        message: 'Order cancelled successfully and stock restored',
        data: order
    });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) {
        filter.status = status;
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
        Order.find(filter)
            .populate('userId', 'name email mobile')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Order.countDocuments(filter)
    ]);

    res.status(200).json({
        status: 'success',
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        data: orders
    });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
        'pending',
        'preparing',
        'shipped',
        'delivered',
        'received',
        'cancelled by admin',
        'cancelled by client',
        'rejected',
        'refunded'
    ];

    if (!allowedStatuses.includes(status)) {
        return next(new AppError('Invalid order status', 400));
    }

    const order = await Order.findById(id);
    if (!order) {
        return next(new AppError('Order not found', 404));
    }

    const previousStatus = order.status;
    order.status = status;
    await order.save();

    const isRestorableNewStatus = ['cancelled by admin', 'rejected', 'refunded'].includes(status);
    const wasAlreadyRestored = ['cancelled by admin', 'cancelled by client', 'rejected', 'refunded'].includes(previousStatus);

    if (isRestorableNewStatus && !wasAlreadyRestored) {
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity }
            });
        }
        logger.info(`Stock restored for order ${order._id} due to status change to "${status}"`);
    }

    logger.info(`Admin updated order ${order._id} status to: ${status}`);

    res.status(200).json({
        status: 'success',
        message: `Order status updated to ${status}`,
        data: order
    });
});
