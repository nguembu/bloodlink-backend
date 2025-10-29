const express = require('express');
const {
  getNearbyAlerts,
  updateDonorLocation,
  updateDonorStatus
} = require('../controllers/donorController');
const { protectUser, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protectUser);

// Donneurs
router.get('/nearby-alerts', authorize('donor'), getNearbyAlerts);
router.patch('/location', authorize('donor'), updateDonorLocation);
router.patch('/status', authorize('donor'), updateDonorStatus);

module.exports = router;