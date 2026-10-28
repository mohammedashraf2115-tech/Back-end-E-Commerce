const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        image: {
            type: String,
            required: true
        },
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        },
        subcategoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subcategory'
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        isDeleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

productSchema.index({ categoryId: 1, isDeleted: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ title: 'text' });

module.exports = mongoose.model('Product', productSchema);
