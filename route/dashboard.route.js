const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { getDashboardStats } = require('../controller/dashboard.controller');

router.use(authanicate, authorize('admin'));

router.get('/stats', getDashboardStats);

module.exports = router;
