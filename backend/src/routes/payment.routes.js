'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { createPaymentSchema, refundPaymentSchema } = require('../validators/payment.validator');

router.use(verifyToken);

router.get('/', authorize('admin', 'receptionist', 'customer'), ctrl.listPayments);
router.get('/:id', authorize('admin', 'receptionist', 'customer'), ctrl.getPayment);
router.post('/', authorize('admin', 'receptionist'), validate(createPaymentSchema), ctrl.createPayment);

// Refund supported via both POST and PATCH for REST consistency
router.post('/:id/refund', authorize('admin'), validate(refundPaymentSchema), ctrl.refundPayment);
router.patch('/:id/refund', authorize('admin'), validate(refundPaymentSchema), ctrl.refundPayment);

module.exports = router;
