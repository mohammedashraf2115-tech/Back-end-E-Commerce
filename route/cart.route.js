const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const {
    getCart,
    addToCart,
    updateItemQuantity,
    removeItem,
    clearCart,
    acceptNewPrices,
    mergeCart
} = require('../controller/cart.controller');

router.use(authanicate);

router.get('/', getCart);
router.post('/items', addToCart);
router.patch('/items/:productId', updateItemQuantity);
router.delete('/items/:productId', removeItem);
router.delete('/', clearCart);
router.post('/accept-prices', acceptNewPrices);
router.post('/merge', mergeCart);

module.exports = router;
