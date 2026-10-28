const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const { getPageBySlug, getAllPages, updatePage } = require('../controller/page.controller');

router.get('/', getAllPages);
router.get('/:slug', getPageBySlug);

router.put('/:slug', authanicate, authorize('admin'), updatePage);

module.exports = router;

