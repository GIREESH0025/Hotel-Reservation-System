'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { verifyToken } = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.use(verifyToken);

// Summary available to admin and receptionist
router.get('/summary', authorize('admin', 'receptionist'), ctrl.summary);
// Revenue and occupancy: admin only
router.get('/revenue', authorize('admin'), ctrl.revenue);
router.get('/occupancy', authorize('admin'), ctrl.occupancy);

module.exports = router;

