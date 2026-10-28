const Product = require('../model/product.model');
const Order = require('../model/order.model');
const Testimonial = require('../model/testimonial.model');
const User = require('../model/user.model');
const catchAsync = require('../utilites/catchAsync.util');

exports.getDashboardStats = catchAsync(async (req, res, next) => {
    const [
        outOfStockCount,
        lowStockProducts,
        pendingOrdersCount,
        pendingTestimonialsCount,
        totalOrdersCount,
        totalUsersCount,
        salesStats
    ] = await Promise.all([
        Product.countDocuments({ stock: 0, isDeleted: false }),
        Product.find({ stock: { $gt: 0, $lte: 3 }, isDeleted: false })
            .select('title stock price image slug')
            .limit(10),
        Order.countDocuments({ status: 'pending' }),
        Testimonial.countDocuments({ status: 'pending' }),
        Order.countDocuments(),
        User.countDocuments({ role: 'user' }),
        Order.aggregate([
            {
                $match: {
                    status: { $nin: ['cancelled by admin', 'cancelled by client', 'rejected', 'refunded'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$totalPrice' },
                    successfulOrders: { $sum: 1 }
                }
            }
        ])
    ]);

    const totalRevenue = salesStats.length > 0 ? salesStats[0].totalRevenue : 0;
    const completedOrders = salesStats.length > 0 ? salesStats[0].successfulOrders : 0;

    res.status(200).json({
        status: 'success',
        data: {
            alerts: {
                outOfStockCount,
                lowStockCount: lowStockProducts.length,
                lowStockProducts,
                pendingOrdersCount,
                pendingTestimonialsCount
            },
            overview: {
                totalRevenue,
                completedOrders,
                totalOrdersCount,
                totalUsersCount
            }
        }
    });
});

