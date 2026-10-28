const Cart = require('../model/cart.model');
const Product = require('../model/product.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');

exports.getCart = catchAsync(async (req, res, next) => {
    let cart = await Cart.findOne({ userId: req.user._id }).populate({
        path: 'items.productId',
        select: 'title price image stock slug isActive isDeleted'
    });

    if (!cart) {
        cart = await Cart.create({ userId: req.user._id, items: [] });
    }

    let hasPriceChanged = false;
    let totalPrice = 0;

    const formattedItems = [];
    const validItems = [];

    for (const item of cart.items) {
        if (!item.productId || item.productId.isDeleted || !item.productId.isActive) {
            continue;
        }

        const currentPrice = item.productId.price;
        const isChanged = item.priceAtAdd !== currentPrice;

        if (isChanged) {
            hasPriceChanged = true;
        }

        totalPrice += currentPrice * item.quantity;

        formattedItems.push({
            product: item.productId,
            quantity: item.quantity,
            priceAtAdd: item.priceAtAdd,
            currentPrice: currentPrice,
            isPriceChanged: isChanged,
            itemTotal: currentPrice * item.quantity
        });

        validItems.push(item);
    }

    if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        await cart.save();
    }

    res.status(200).json({
        status: 'success',
        data: {
            items: formattedItems,
            hasPriceChanged,
            totalPrice
        }
    });
});

exports.addToCart = catchAsync(async (req, res, next) => {
    const { productId, quantity = 1 } = req.body;

    const product = await Product.findOne({ _id: productId, isDeleted: false, isActive: true });
    if (!product) {
        return next(new AppError('Product not found or unavailable', 404));
    }

    if (product.stock === 0) {
        return next(new AppError('This product is out of stock', 400));
    }

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
        cart = new Cart({ userId: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

    if (itemIndex > -1) {
        const newQty = cart.items[itemIndex].quantity + Number(quantity);
        if (newQty > product.stock) {
            return next(new AppError(`Only ${product.stock} items available in stock`, 400));
        }
        cart.items[itemIndex].quantity = newQty;
    } else {
        if (Number(quantity) > product.stock) {
            return next(new AppError(`Only ${product.stock} items available in stock`, 400));
        }
        cart.items.push({
            productId,
            quantity: Number(quantity),
            priceAtAdd: product.price
        });
    }

    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'Product added to cart',
        data: cart
    });
});

exports.updateItemQuantity = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || Number(quantity) < 1) {
        return next(new AppError('Quantity must be at least 1', 400));
    }

    const product = await Product.findOne({ _id: productId, isDeleted: false, isActive: true });
    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    if (Number(quantity) > product.stock) {
        return next(new AppError(`Only ${product.stock} items available in stock`, 400));
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    const item = cart.items.find(i => i.productId.toString() === productId);
    if (!item) {
        return next(new AppError('Product not in cart', 404));
    }

    item.quantity = Number(quantity);
    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'Cart quantity updated',
        data: cart
    });
});

exports.removeItem = catchAsync(async (req, res, next) => {
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    cart.items = cart.items.filter(i => i.productId.toString() !== productId);
    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'Item removed from cart',
        data: cart
    });
});

exports.clearCart = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { items: [] },
        { new: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Cart cleared',
        data: cart
    });
});

exports.acceptNewPrices = catchAsync(async (req, res, next) => {
    const cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'price');
    if (!cart) {
        return next(new AppError('Cart not found', 404));
    }

    for (const item of cart.items) {
        if (item.productId && item.productId.price) {
            item.priceAtAdd = item.productId.price;
        }
    }

    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'Cart prices updated to current prices',
        data: cart
    });
});

exports.mergeCart = catchAsync(async (req, res, next) => {
    const { items = [] } = req.body;

    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
        cart = new Cart({ userId: req.user._id, items: [] });
    }

    for (const guestItem of items) {
        const product = await Product.findOne({
            _id: guestItem.productId,
            isDeleted: false,
            isActive: true
        });

        if (!product || product.stock === 0) continue;

        const existingIndex = cart.items.findIndex(
            i => i.productId.toString() === guestItem.productId.toString()
        );

        const requestedQty = Number(guestItem.quantity) || 1;

        if (existingIndex > -1) {
            const combinedQty = cart.items[existingIndex].quantity + requestedQty;
            cart.items[existingIndex].quantity = Math.min(combinedQty, product.stock);
        } else {
            const finalQty = Math.min(requestedQty, product.stock);
            cart.items.push({
                productId: product._id,
                quantity: finalQty,
                priceAtAdd: product.price
            });
        }
    }

    await cart.save();

    res.status(200).json({
        status: 'success',
        message: 'Cart merged successfully',
        data: cart
    });
});

