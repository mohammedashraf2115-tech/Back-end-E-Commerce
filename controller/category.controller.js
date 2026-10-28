const Category = require('../model/category.model');
const Subcategory = require('../model/subcategory.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');
const cache = require('../utilites/cache.util');
const logger = require('../utilites/logger.util');

const CATEGORIES_CACHE_KEY = 'categoriesList';

exports.getCategories = catchAsync(async (req, res, next) => {
    const cachedCategories = cache.get(CATEGORIES_CACHE_KEY);
    if (cachedCategories) {
        logger.info('Serving categories from cache');
        return res.status(200).json({
            status: 'success',
            cached: true,
            results: cachedCategories.length,
            data: cachedCategories
        });
    }

    const categories = await Category.find({ isDeleted: false, isActive: true });
    cache.set(CATEGORIES_CACHE_KEY, categories);

    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: categories
    });
});

exports.getCategoryBySlug = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const category = await Category.findOne({ slug, isDeleted: false, isActive: true });

    if (!category) {
        return next(new AppError(`Category not found with slug: ${slug}`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: category
    });
});

exports.addCategory = catchAsync(async (req, res, next) => {
    const { name } = req.body;
    let { slug } = req.body;

    if (!slug && name) {
        slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const newCategory = await Category.create({ name, slug });
    cache.del(CATEGORIES_CACHE_KEY);
    logger.info(`Admin created category: ${newCategory._id}`);

    res.status(201).json({
        status: 'success',
        message: 'Category created successfully',
        data: newCategory
    });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, slug, isActive } = req.body;

    const updatedCategory = await Category.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { name, slug, isActive },
        { new: true, runValidators: true }
    );

    if (!updatedCategory) {
        return next(new AppError('Category not found', 404));
    }

    cache.del(CATEGORIES_CACHE_KEY);

    res.status(200).json({
        status: 'success',
        message: 'Category updated successfully',
        data: updatedCategory
    });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const category = await Category.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!category) {
        return next(new AppError('Category not found', 404));
    }

    await Subcategory.updateMany({ categoryId: id }, { isDeleted: true });

    cache.del(CATEGORIES_CACHE_KEY);
    logger.info(`Admin soft-deleted category: ${id} and its subcategories`);

    res.status(200).json({
        status: 'success',
        message: 'Category and its subcategories deleted successfully'
    });
});

exports.getSubcategoriesByCategory = catchAsync(async (req, res, next) => {
    const { categoryId } = req.params;

    const category = await Category.findOne({ _id: categoryId, isDeleted: false, isActive: true });
    if (!category) {
        return next(new AppError('Category not found or inactive', 404));
    }

    const subcategories = await Subcategory.find({
        categoryId,
        isDeleted: false,
        isActive: true
    });

    res.status(200).json({
        status: 'success',
        results: subcategories.length,
        data: subcategories
    });
});

exports.addSubcategory = catchAsync(async (req, res, next) => {
    const { name, categoryId } = req.body;
    let { slug } = req.body;

    const parentCategory = await Category.findOne({ _id: categoryId, isDeleted: false });
    if (!parentCategory) {
        return next(new AppError('Invalid category ID: Category does not exist', 404));
    }

    if (!slug && name) {
        slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const newSubcategory = await Subcategory.create({
        name,
        slug,
        categoryId
    });

    logger.info(`Admin created subcategory: ${newSubcategory._id} for category: ${categoryId}`);

    res.status(201).json({
        status: 'success',
        message: 'Subcategory created successfully',
        data: newSubcategory
    });
});

exports.updateSubcategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, slug, isActive, categoryId } = req.body;

    if (categoryId) {
        const parentCategory = await Category.findOne({ _id: categoryId, isDeleted: false });
        if (!parentCategory) {
            return next(new AppError('Invalid category ID: Category does not exist', 404));
        }
    }

    const updatedSubcategory = await Subcategory.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { name, slug, isActive, categoryId },
        { new: true, runValidators: true }
    );

    if (!updatedSubcategory) {
        return next(new AppError('Subcategory not found', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Subcategory updated successfully',
        data: updatedSubcategory
    });
});

exports.deleteSubcategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const subcategory = await Subcategory.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!subcategory) {
        return next(new AppError('Subcategory not found', 404));
    }

    logger.info(`Admin soft-deleted subcategory: ${id}`);

    res.status(200).json({
        status: 'success',
        message: 'Subcategory deleted successfully'
    });
});
