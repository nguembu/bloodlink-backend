const express = require('express');
const { 
  register, 
  login, 
  getProfile,
  registerBloodBank,
  loginBloodBank 
} = require('../controllers/authController');
const { protectUser, protectBloodBank } = require('../middleware/auth');

const router = express.Router();

// Routes User (donneurs et médecins)
router.post('/register', register);
router.post('/login', login);
router.get('/profile', protectUser, getProfile);

// Routes BloodBank
router.post('/bloodbank/register', registerBloodBank);
router.post('/bloodbank/login', loginBloodBank);
router.get('/bloodbank/profile', protectBloodBank, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        bloodBank: req.bloodBank
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;