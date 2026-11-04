'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createPaymentSchema } = require('../validators/payment.validator');

router.use(verifyToken);

router.get('/', authorize('admin', 'receptionist', 'customer'), ctrl.listPayments);
router.get('/:id', authorize('admin', 'receptionist', 'customer'), ctrl.getPayment);
router.post('/', authorize('admin', 'receptionist'), validate(createPaymentSchema), ctrl.createPayment);
router.patch('/:id/refund', authorize('admin'), ctrl.refundPayment);

module.exports = router;

