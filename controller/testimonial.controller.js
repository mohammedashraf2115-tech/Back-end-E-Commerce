const Testimonial = require('../model/testimonial.model');
const AppError = require('../utilites/appError.util');
const catchAsync = require('../utilites/catchAsync.util');

exports.getApprovedTestimonials = catchAsync(async (req, res, next) => {
    const testimonials = await Testimonial.find({ status: 'approved' })
        .populate('userId', 'name')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: testimonials.length,
        data: testimonials
    });
});

exports.createTestimonial = catchAsync(async (req, res, next) => {
    const { message, rating } = req.body;

    const newTestimonial = await Testimonial.create({
        userId: req.user._id,
        message,
        rating: rating || 5,
        status: 'pending'
    });

    res.status(201).json({
        status: 'success',
        message: 'Testimonial submitted for review',
        data: newTestimonial
    });
});

exports.getAllTestimonials = catchAsync(async (req, res, next) => {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const testimonials = await Testimonial.find(filter)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        results: testimonials.length,
        data: testimonials
    });
});

exports.updateTestimonialStatus = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return next(new AppError('Invalid status value', 400));
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!testimonial) {
        return next(new AppError('Testimonial not found', 404));
    }

    res.status(200).json({
        status: 'success',
        message: `Testimonial status updated to ${status}`,
        data: testimonial
    });
});

exports.deleteTestimonial = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const testimonial = await Testimonial.findByIdAndDelete(id);
    if (!testimonial) {
        return next(new AppError('Testimonial not found', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Testimonial deleted successfully'
    });
});

