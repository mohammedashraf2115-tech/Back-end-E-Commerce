module.exports = (Model) => async (req, res, next) => {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const skip   = (page - 1) * limit;
    const sortBy = req.query.sort  || 'createdAt';
    const order  = req.query.order === 'desc' ? -1 : 1;

    const [results, total] = await Promise.all([
        Model.find({ isDeleted: false }).sort({ [sortBy]: order }).skip(skip).limit(limit),
        Model.countDocuments({ isDeleted: false }),
    ]);

    res.status(200).json({
        message:      `Pagination for ${Model.modelName}`,
        page,
        limit,
        totalPages:   Math.ceil(total / limit),
        totalResults: total,
        data:         results,
    });
};
