const { createBackup, restoreDB } = require('../service/databases.service');

exports.createBackup = (req, res) => {
    createBackup();
    res.status(201).json({
        status: 'success',
        message: 'Database backup initiated'
    });
};

exports.restoreDB = (req, res) => {
    const { folderName } = req.body;
    if (!folderName) {
        return res.status(400).json({
            status: 'fail',
            message: 'Folder name is required to restore database'
        });
    }

    restoreDB(folderName);
    res.status(200).json({
        status: 'success',
        message: `Database restore initiated from ${folderName}`
    });
};

