const Alert = require('../models/Alert');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');

// Donneur : Obtenir les alertes à proximité
exports.getNearbyAlerts = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;

    let userCoords;
    if (latitude && longitude) {
      userCoords = [parseFloat(longitude), parseFloat(latitude)];
    } else if (req.user.location && req.user.location.coordinates) {
      userCoords = req.user.location.coordinates;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Localisation requise.'
      });
    }

    // Trouver les banques de sang à proximité
    const bloodBanks = await BloodBank.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: userCoords
          },
          $maxDistance: maxDistance * 1000
        }
      },
      isActive: true
    });

    const bloodBankIds = bloodBanks.map(bank => bank._id);

    // Trouver les alertes actives de ces banques
    const alerts = await Alert.find({
      bloodBank: { $in: bloodBankIds },
      status: 'pending', // Seulement les alertes en attente
      expiresAt: { $gt: new Date() }
    })
    .populate('bloodBank', 'hospitalName address phone')
    .populate('doctor', 'name hospital')
    .sort({ urgency: -1, createdAt: -1 });

    res.json({
      success: true,
      data: { alerts }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour la localisation du donneur
exports.updateDonorLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    await req.user.updateLocation(latitude, longitude);

    res.json({
      success: true,
      message: 'Localisation mise à jour avec succès.',
      data: { user: req.user }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Mettre à jour le statut du donneur
exports.updateDonorStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['available', 'unavailable'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide.'
      });
    }

    req.user.status = status;
    await req.user.save();

    res.json({
      success: true,
      message: `Statut mis à jour: ${status}`,
      data: { user: req.user }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};