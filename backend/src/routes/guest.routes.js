'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/guest.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { guestSchema, updateGuestSchema } = require('../validators/guest.validator');

router.use(verifyToken);

router.get('/', authorize('admin', 'receptionist', 'customer'), ctrl.listGuests);
router.get('/:id', authorize('admin', 'receptionist', 'customer'), ctrl.getGuest);
router.post('/', authorize('admin', 'receptionist'), validate(guestSchema), ctrl.createGuest);
router.patch('/:id', authorize('admin', 'receptionist'), validate(updateGuestSchema), ctrl.updateGuest);
router.delete('/:id', authorize('admin'), ctrl.deleteGuest);

module.exports = router;

