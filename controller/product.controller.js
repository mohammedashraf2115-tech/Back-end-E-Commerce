const Product = require('../model/product.model');
const Category = require('../model/category.model');
const Subcategory = require('../model/subcategory.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');
const cache = require('../utilites/cache.util');
const logger = require('../utilites/logger.util');

const PRODUCT_CACHE_KEY = 'productsList';

exports.getProducts = catchAsync(async (req, res, next) => {
    const { search, category, minPrice, maxPrice, page = 1, limit = 10, sort = 'createdAt', order = 'desc' } = req.query;

    const isSimpleList = !search && !category && !minPrice && !maxPrice && page == 1 && (!req.query.limit || req.query.limit == 10);
    if (isSimpleList) {
        const cachedProducts = cache.get(PRODUCT_CACHE_KEY);
        if (cachedProducts) {
            logger.info('Serving products from cache');
            return res.status(200).json({
                status: 'success',
                cached: true,
                results: cachedProducts.length,
                data: cachedProducts
            });
        }
    }

    const filter = { isDeleted: false, isActive: true };

    if (search) {
        filter.title = { $regex: search, $options: 'i' };
    }

    if (category) {
        filter.categoryId = category;
    }

    if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'desc' ? -1 : 1;

    const [products, total] = await Promise.all([
        Product.find(filter)
            .populate('categoryId', 'name slug')
            .populate('subcategoryId', 'name slug')
            .sort({ [sort]: sortOrder })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Product.countDocuments(filter)
    ]);

    if (isSimpleList) {
        cache.set(PRODUCT_CACHE_KEY, products);
    }

    res.status(200).json({
        status: 'success',
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalResults: total,
        data: products
    });
});

exports.getProductBySlug = catchAsync(async (req, res, next) => {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isDeleted: false, isActive: true })
        .populate('categoryId', 'name slug')
        .populate('subcategoryId', 'name slug')
        .lean();

    if (!product) {
        return next(new AppError(`Product not found with slug: ${slug}`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: product
    });
});

exports.getRelatedProducts = catchAsync(async (req, res, next) => {
    const { slug } = req.params;

    const currentProduct = await Product.findOne({ slug, isDeleted: false });
    if (!currentProduct) {
        return next(new AppError('Product not found', 404));
    }

    const relatedProducts = await Product.find({
        categoryId: currentProduct.categoryId,
        slug: { $ne: slug },
        isDeleted: false,
        isActive: true
    }).limit(4).lean();

    res.status(200).json({
        status: 'success',
        results: relatedProducts.length,
        data: relatedProducts
    });
});

exports.addProduct = catchAsync(async (req, res, next) => {
    const { title, description, price, stock, categoryId, subcategoryId } = req.body;
    let { slug } = req.body;

    if (!req.file) {
        return next(new AppError('Product image is required', 400));
    }

    const categoryExists = await Category.findOne({ _id: categoryId, isDeleted: false });
    if (!categoryExists) {
        return next(new AppError('Invalid category ID', 400));
    }

    if (subcategoryId) {
        const subcategoryExists = await Subcategory.findOne({ _id: subcategoryId, categoryId, isDeleted: false });
        if (!subcategoryExists) {
            return next(new AppError('Invalid subcategory ID for this category', 400));
        }
    }

    if (!slug && title) {
        slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }

    const image = req.file.filename;

    const newProduct = await Product.create({
        title,
        description,
        price,
        stock,
        categoryId,
        subcategoryId: subcategoryId || null,
        slug,
        image
    });

    cache.del(PRODUCT_CACHE_KEY);
    logger.info(`Admin created product: ${newProduct._id}`);

    res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: newProduct
    });
});

exports.updateProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, price, stock, categoryId, subcategoryId, slug, isActive } = req.body;

    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    if (categoryId) {
        const categoryExists = await Category.findOne({ _id: categoryId, isDeleted: false });
        if (!categoryExists) {
            return next(new AppError('Invalid category ID', 400));
        }
        product.categoryId = categoryId;
    }

    if (subcategoryId) {
        const catId = categoryId || product.categoryId;
        const subcategoryExists = await Subcategory.findOne({ _id: subcategoryId, categoryId: catId, isDeleted: false });
        if (!subcategoryExists) {
            return next(new AppError('Invalid subcategory ID for this category', 400));
        }
        product.subcategoryId = subcategoryId;
    }

    if (title) product.title = title;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;
    if (slug) product.slug = slug;
    if (isActive !== undefined) product.isActive = isActive;
    if (req.file) product.image = req.file.filename;

    await product.save();

    cache.del(PRODUCT_CACHE_KEY);
    logger.info(`Admin updated product: ${product._id}`);

    res.status(200).json({
        status: 'success',
        message: 'Product updated successfully',
        data: product
    });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    );

    if (!product) {
        return next(new AppError('Product not found', 404));
    }

    cache.del(PRODUCT_CACHE_KEY);
    logger.info(`Admin soft-deleted product: ${id}`);

    res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully'
    });
});
