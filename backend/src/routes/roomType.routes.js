'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/roomType.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { roomTypeSchema, updateRoomTypeSchema } = require('../validators/roomType.validator');

// Public room-type browsing
router.get('/', optionalToken, ctrl.listRoomTypes);
router.get('/:id', optionalToken, ctrl.getRoomType);

// Protected room-type modifications (Admin only)
router.use(verifyToken);
router.post('/', authorize('admin'), validate(roomTypeSchema), ctrl.createRoomType);
router.patch('/:id', authorize('admin'), validate(updateRoomTypeSchema), ctrl.updateRoomType);
router.delete('/:id', authorize('admin'), ctrl.deleteRoomType);

module.exports = router;

