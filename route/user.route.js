const express = require('express');
const router = express.Router();

const { authanicate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');

const {
    getMe,
    updateMe,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    getAllUsers,
    toggleBlockUser,
    createAdmin
} = require('../controller/user.controller');

router.use(authanicate);

router.get('/me', getMe);
router.patch('/update-me', updateMe);

router.post('/addresses', addAddress);
router.put('/addresses/:addressId', updateAddress);
router.delete('/addresses/:addressId', deleteAddress);
router.patch('/addresses/:addressId/default', setDefaultAddress);

router.get('/', authorize('admin'), getAllUsers);
router.patch('/block/:userId', authorize('admin'), toggleBlockUser);
router.post('/create-admin', authorize('admin'), createAdmin);

module.exports = router;
