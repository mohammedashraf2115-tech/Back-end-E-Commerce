const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { createBackup, restoreDB } = require('../controller/db.controller');

router.use(authanicate, authorize('admin'));

router.get('/backup-db', createBackup);
router.post('/restore-db', restoreDB);

module.exports = router;
