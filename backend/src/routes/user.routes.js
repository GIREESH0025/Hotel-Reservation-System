'use strict';
const router = require('express').Router();
const { listUsers, getUser, updateUser, deleteUser, changePassword } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateUserSchema, changePasswordSchema } = require('../validators/user.validator');

router.use(verifyToken);

// User-level self password change
router.patch('/change-password', validate(changePasswordSchema), changePassword);

router.get('/', authorize('admin'), listUsers);
router.get('/:id', authorize('admin', 'receptionist', 'customer'), getUser);
router.patch('/:id', authorize('admin', 'customer'), validate(updateUserSchema), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;

