'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/reservation.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createReservationSchema, updateReservationSchema } = require('../validators/reservation.validator');

router.use(verifyToken);

router.get('/', authorize('admin', 'receptionist', 'customer'), ctrl.listReservations);
router.get('/:id', authorize('admin', 'receptionist', 'customer'), ctrl.getReservation);
router.post('/', authorize('admin', 'receptionist', 'customer'), validate(createReservationSchema), ctrl.createReservation);
router.patch('/:id', authorize('admin', 'receptionist'), validate(updateReservationSchema), ctrl.updateReservation);
router.delete('/:id', authorize('admin'), ctrl.deleteReservation);

// Status transitions
router.patch('/:id/confirm', authorize('admin', 'receptionist'), ctrl.confirmReservation);
router.patch('/:id/check-in', authorize('admin', 'receptionist'), ctrl.checkIn);
router.patch('/:id/check-out', authorize('admin', 'receptionist'), ctrl.checkOut);
router.patch('/:id/cancel', authorize('admin', 'receptionist', 'customer'), ctrl.cancelReservation);

module.exports = router;

