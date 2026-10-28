const { exec } = require('child_process');
const path = require('path');
const logger = require('../utilites/logger.util');

exports.createBackup = () => {
    const backupFolder = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.join(__dirname, '..', 'backups', backupFolder);

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
    const command = `mongodump --uri="${mongoUri}" --out="${backupPath}" --gzip`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Backup failed: ${error.message}`);
            return;
        }
        logger.info(`Backup created successfully at: ${backupPath}`);
    });
};

exports.restoreDB = (folderName) => {
    const backupPath = path.join(__dirname, '..', 'backups', folderName);
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce';
    const command = `mongorestore --uri="${mongoUri}" --gzip "${backupPath}" --drop`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Restore failed: ${error.message}`);
            return;
        }
        logger.info(`Database restored successfully from: ${backupPath}`);
    });
};

