'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/roomType.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { roomTypeSchema, updateRoomTypeSchema } = require('../validators/roomType.validator');

router.use(verifyToken);

router.get('/', ctrl.listRoomTypes);
router.get('/:id', ctrl.getRoomType);
router.post('/', authorize('admin'), validate(roomTypeSchema), ctrl.createRoomType);
router.patch('/:id', authorize('admin'), validate(updateRoomTypeSchema), ctrl.updateRoomType);
router.delete('/:id', authorize('admin'), ctrl.deleteRoomType);

module.exports = router;

