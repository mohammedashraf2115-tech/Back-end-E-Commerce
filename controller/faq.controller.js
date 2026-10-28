const FAQ = require('../model/faq.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');

exports.getActiveFAQs = catchAsync(async (req, res, next) => {
    const faqs = await FAQ.find({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: faqs.length,
        data: faqs
    });
});

exports.getAllFAQs = catchAsync(async (req, res, next) => {
    const faqs = await FAQ.find().sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: faqs.length,
        data: faqs
    });
});

exports.createFAQ = catchAsync(async (req, res, next) => {
    const { question, answer, isActive } = req.body;

    const newFAQ = await FAQ.create({
        question,
        answer,
        isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
        status: 'success',
        message: 'FAQ created successfully',
        data: newFAQ
    });
});

exports.updateFAQ = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { question, answer, isActive } = req.body;

    const updatedFAQ = await FAQ.findByIdAndUpdate(
        id,
        { question, answer, isActive },
        { new: true, runValidators: true }
    );

    if (!updatedFAQ) {
        return next(new AppError('FAQ not found', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'FAQ updated successfully',
        data: updatedFAQ
    });
});

exports.deleteFAQ = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const faq = await FAQ.findByIdAndDelete(id);
    if (!faq) {
        return next(new AppError('FAQ not found', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'FAQ deleted permanently'
    });
});

