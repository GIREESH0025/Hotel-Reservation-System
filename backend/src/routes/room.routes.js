'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/room.controller');
const { verifyToken, optionalToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { roomSchema, updateRoomSchema } = require('../validators/room.validator');

// Availability is public (can be checked by anyone visiting the hotel site)
router.get('/availability', optionalToken, ctrl.getAvailability);

router.use(verifyToken);

router.get('/', authorize('admin', 'receptionist'), ctrl.listRooms);
router.get('/:id', authorize('admin', 'receptionist'), ctrl.getRoom);
router.post('/', authorize('admin'), validate(roomSchema), ctrl.createRoom);
router.patch('/:id', authorize('admin', 'receptionist'), validate(updateRoomSchema), ctrl.updateRoom);
router.delete('/:id', authorize('admin'), ctrl.deleteRoom);

module.exports = router;

