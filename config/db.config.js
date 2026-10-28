const mongoose = require('mongoose');
const logger = require('../utilites/logger.util');

const conectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info('MongoDB connected');
    } catch (err) {
        logger.error(`MongoDB connection error: ${err.message}`);
        process.exit(1);
    }
};

module.exports = { conectDB };

