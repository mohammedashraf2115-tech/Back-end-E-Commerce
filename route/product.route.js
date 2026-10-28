const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { upload } = require('../middlewares/upload.middleware');
const paginate = require('../middlewares/paginate.middleware');
const Product = require('../model/product.model');

const {
    getProducts,
    getProductBySlug,
    getRelatedProducts,
    addProduct,
    updateProduct,
    deleteProduct
} = require('../controller/product.controller');

router.get('/', getProducts);
router.get('/pages', paginate(Product));
router.get('/:slug', getProductBySlug);
router.get('/related/:slug', getRelatedProducts);

router.post('/', authanicate, authorize('admin'), upload.single('image'), addProduct);
router.put('/:id', authanicate, authorize('admin'), upload.single('image'), updateProduct);
router.delete('/:id', authanicate, authorize('admin'), deleteProduct);

module.exports = router;
