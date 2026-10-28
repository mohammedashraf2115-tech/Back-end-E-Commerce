const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const {
    getApprovedTestimonials,
    createTestimonial,
    getAllTestimonials,
    updateTestimonialStatus,
    deleteTestimonial
} = require('../controller/testimonial.controller');

router.get('/', getApprovedTestimonials);
router.post('/', authanicate, createTestimonial);

router.use(authanicate, authorize('admin'));

router.get('/all', getAllTestimonials);
router.patch('/:id/status', updateTestimonialStatus);
router.delete('/:id', deleteTestimonial);

module.exports = router;
