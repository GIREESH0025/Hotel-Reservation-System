'use strict';
const router = require('express').Router();
const { listUsers, getUser, updateUser, deleteUser } = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { updateUserSchema } = require('../validators/user.validator');

router.use(verifyToken);

router.get('/', authorize('admin'), listUsers);
router.get('/:id', authorize('admin', 'receptionist', 'customer'), getUser);
router.patch('/:id', authorize('admin', 'customer'), validate(updateUserSchema), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;

