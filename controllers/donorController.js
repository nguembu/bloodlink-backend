const { Op } = require('sequelize');
const Alert = require('../models/Alert');
const BloodBank = require('../models/BloodBank');
const User = require('../models/User');
const AlertResponse = require('../models/AlertResponse');
const { findUsersInRadius } = require('../utils/geolocation');

// Obtenir les alertes à proximité
exports.getNearbyAlerts = async (req, res) => {
  try {
    let userCoords;
    const { latitude, longitude, maxDistance = 50 } = req.query;

    if (latitude && longitude) {
      userCoords = [parseFloat(longitude), parseFloat(latitude)];
    } else if (req.user.latitude && req.user.longitude) {
      userCoords = [req.user.longitude, req.user.latitude];
    } else {
      return res.status(400).json({ success: false, message: 'Localisation requise.' });
    }

    // Trouver banques de sang proches
    const bloodBanks = await BloodBank.findAll();
    const nearbyBanks = bloodBanks.filter(bank => {
      const distance = findUsersInRadius(userCoords[1], userCoords[0], 0, bank.latitude, bank.longitude);
      return distance <= maxDistance;
    });

    const bloodBankIds = nearbyBanks.map(bank => bank.id);

    const alerts = await Alert.findAll({
      where: { bloodBankId: { [Op.in]: bloodBankIds }, status: 'pending', expiresAt: { [Op.gt]: new Date() } },
      include: [
        { model: BloodBank, as: 'bloodBank', attributes: ['id','hospitalName','address','phone'] },
        { model: User, as: 'doctor', attributes: ['id','name','hospital'] }
      ],
      order: [['urgency','DESC'], ['createdAt','DESC']]
    });

    const alertsJson = alerts.map(a => ({ ...a.toJSON(), _id: a.id }));

    res.json({ success: true, data: { alerts: alertsJson } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mettre à jour localisation du donneur
exports.updateDonorLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    req.user.latitude = latitude;
    req.user.longitude = longitude;
    await req.user.save();

    res.json({ success: true, message: 'Localisation mise à jour avec succès.', data: { user: req.user } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mettre à jour statut du donneur
exports.updateDonorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available', 'unavailable'].includes(status)) return res.status(400).json({ success: false, message: 'Statut invalide.' });

    req.user.status = status;
    await req.user.save();

    res.json({ success: true, message: `Statut mis à jour: ${status}`, data: { user: req.user } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
