const Page = require('../model/page.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');

exports.getPageBySlug = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const page = await Page.findOne({ slug });

    if (!page) {
        return next(new AppError(`Page not found with slug: ${slug}`, 404));
    }

    res.status(200).json({
        status: 'success',
        data: page
    });
});

exports.getAllPages = catchAsync(async (req, res, next) => {
    const pages = await Page.find().sort({ createdAt: 1 });

    res.status(200).json({
        status: 'success',
        results: pages.length,
        data: pages
    });
});

exports.updatePage = catchAsync(async (req, res, next) => {
    const { slug } = req.params;
    const { title, content } = req.body;

    const page = await Page.findOneAndUpdate(
        { slug },
        { title, content },
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
        status: 'success',
        message: 'Page updated successfully',
        data: page
    });
});

