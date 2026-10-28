const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrderByClient,
    getAllOrders,
    updateOrderStatus
} = require('../controller/order.controller');

router.use(authanicate);

router.post('/', createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrderByClient);

router.get('/', authorize('admin'), getAllOrders);
router.patch('/:id/status', authorize('admin'), updateOrderStatus);

module.exports = router;
