const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        title: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        addressId: {
            type: mongoose.Schema.Types.ObjectId
        },
        addressSnapshot: {
            title: { type: String, required: true },
            street: { type: String, required: true },
            city: { type: String, required: true }
        },
        mobileSnapshot: {
            type: String,
            required: true
        },
        orderItems: [orderItemSchema],
        totalPrice: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: [
                'pending',
                'preparing',
                'shipped',
                'delivered',
                'received',
                'cancelled by admin',
                'cancelled by client',
                'rejected',
                'refunded'
            ],
            default: 'pending'
        },
        paymentMethod: {
            type: String,
            default: 'COD'
        },
        timestamp: {
            type: Number,
            default: Date.now
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);

