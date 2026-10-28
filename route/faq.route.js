const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const {
    getActiveFAQs,
    getAllFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ
} = require('../controller/faq.controller');

router.get('/', getActiveFAQs);

router.use(authanicate, authorize('admin'));

router.get('/all', getAllFAQs);
router.post('/', createFAQ);
router.put('/:id', updateFAQ);
router.delete('/:id', deleteFAQ);

module.exports = router;
