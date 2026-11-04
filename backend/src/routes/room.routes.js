'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/room.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { roomSchema, updateRoomSchema } = require('../validators/room.validator');

// Availability is public (authenticated but all roles)
router.get('/availability', verifyToken, ctrl.getAvailability);

router.use(verifyToken);

router.get('/', authorize('admin', 'receptionist'), ctrl.listRooms);
router.get('/:id', authorize('admin', 'receptionist'), ctrl.getRoom);
router.post('/', authorize('admin'), validate(roomSchema), ctrl.createRoom);
router.patch('/:id', authorize('admin', 'receptionist'), validate(updateRoomSchema), ctrl.updateRoom);
router.delete('/:id', authorize('admin'), ctrl.deleteRoom);

module.exports = router;

