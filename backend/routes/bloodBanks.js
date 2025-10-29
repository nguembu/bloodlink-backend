const express = require('express');
const {
  updateInventory,
  getInventory,
  findNearbyBloodBanks,
  getBloodBankProfile
} = require('../controllers/bloodBankController');
const { protectBloodBank } = require('../middleware/auth');

const router = express.Router();

// Routes BloodBank (protégées par protectBloodBank)
router.patch('/inventory', protectBloodBank, updateInventory);
router.get('/inventory', protectBloodBank, getInventory);
router.get('/profile', protectBloodBank, getBloodBankProfile);

// Route publique pour trouver les banques de sang à proximité
router.get('/nearby', findNearbyBloodBanks);

module.exports = router;