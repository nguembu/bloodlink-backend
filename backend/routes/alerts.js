const express = require('express');
const {
  createAlert,
  notifyDonors,
  respondToAlert,
  getBloodBankAlerts,
  getDoctorAlerts
} = require('../controllers/alertController');
const { protectUser, protectBloodBank, authorize } = require('../middleware/auth');

const router = express.Router();

// Médecins - protection User
router.post('/', protectUser, authorize('doctor'), createAlert);
router.get('/doctor', protectUser, authorize('doctor'), getDoctorAlerts);

// Banques de sang - protection BloodBank
router.get('/bloodbank', protectBloodBank, getBloodBankAlerts);
router.post('/notify-donors', protectBloodBank, notifyDonors);

// Donneurs - protection User
router.post('/:alertId/respond', protectUser, authorize('donor'), respondToAlert);

module.exports = router;