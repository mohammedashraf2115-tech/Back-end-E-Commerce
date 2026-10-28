const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const {
    getCategories,
    getCategoryBySlug,
    addCategory,
    updateCategory,
    deleteCategory,
    getSubcategoriesByCategory,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory
} = require('../controller/category.controller');

router.get('/', getCategories);
router.get('/:slug', getCategoryBySlug);
router.get('/:categoryId/subcategories', getSubcategoriesByCategory);

router.use(authanicate, authorize('admin'));

router.post('/', addCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

router.post('/subcategory/add', addSubcategory);
router.put('/subcategory/:id', updateSubcategory);
router.delete('/subcategory/:id', deleteSubcategory);

module.exports = router;
