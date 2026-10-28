const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String,
            required: true,
            trim: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: 5
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    },
    {
        timestamps: true
    }
);

testimonialSchema.index({ status: 1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);

