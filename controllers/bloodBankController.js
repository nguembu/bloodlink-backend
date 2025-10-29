const BloodBank = require('../models/BloodBank');
const bcrypt = require('bcryptjs');

// Mettre à jour l'inventaire de sang
exports.updateInventory = async (req, res) => {
  try {
    const { bloodType, quantity } = req.body;

    if (!bloodType || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Type de sang et quantité requis.'
      });
    }

    await req.bloodBank.updateInventory(bloodType, quantity);

    res.json({
      success: true,
      message: 'Inventaire mis à jour avec succès.',
      data: { bloodBank: req.bloodBank }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir l'inventaire
exports.getInventory = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        inventory: req.bloodBank.bloodInventory,
        bloodBank: {
          hospitalName: req.bloodBank.hospitalName,
          address: req.bloodBank.address,
          phone: req.bloodBank.phone
        }
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir le profil de la bloodbank
exports.getBloodBankProfile = async (req, res) => {
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
};

// Trouver les banques de sang à proximité (publique)
exports.findNearbyBloodBanks = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises.'
      });
    }

    const bloodBanks = await BloodBank.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000
        }
      },
      isActive: true
    }).select('-password'); // Exclure le mot de passe

    res.json({
      success: true,
      data: { bloodBanks }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};