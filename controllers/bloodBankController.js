const BloodBank = require('../models/BloodBank');
const { Op } = require('sequelize');

// Mettre à jour inventaire
exports.updateInventory = async (req, res) => {
  try {
    const { bloodType, quantity } = req.body;
    if (!bloodType || quantity === undefined) return res.status(400).json({ success: false, message: 'Type de sang et quantité requis.' });

    req.bloodBank.bloodInventory[bloodType] += quantity;
    await req.bloodBank.save();

    res.json({ success: true, message: 'Inventaire mis à jour avec succès.', data: { bloodBank: req.bloodBank } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Obtenir inventaire
exports.getInventory = async (req, res) => {
  try {
    res.json({ success: true, data: { inventory: req.bloodBank.bloodInventory, bloodBank: { hospitalName: req.bloodBank.hospitalName, address: req.bloodBank.address, phone: req.bloodBank.phone } } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Profil banque de sang
exports.getBloodBankProfile = async (req, res) => {
  try {
    res.json({ success: true, data: { bloodBank: req.bloodBank } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Trouver banques de sang à proximité
exports.findNearbyBloodBanks = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Latitude et longitude requises.' });

    const bloodBanks = await BloodBank.findAll();
    const nearby = bloodBanks.filter(bank => {
      const dist = Math.sqrt(Math.pow(bank.latitude - latitude,2) + Math.pow(bank.longitude - longitude,2));
      return dist <= maxDistance/111; // approx conversion km->deg
    });

    res.json({ success: true, data: { bloodBanks: nearby } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
