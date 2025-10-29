const { Alert, User, BloodBank } = require('../models');
const { findUsersInRadius } = require('../utils/geolocation');

// Obtenir alertes à proximité
exports.getNearbyAlerts = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;
    const userCoords = latitude && longitude ? [parseFloat(latitude), parseFloat(longitude)] : [req.user.longitude, req.user.latitude];
    if (!userCoords) return res.status(400).json({ success: false, message: 'Localisation requise.' });

    const bloodBanks = await BloodBank.findAll({ 
      where: findUsersInRadius(userCoords[1], userCoords[0], maxDistance)
    });

    const bloodBankIds = bloodBanks.map(bank => bank.id);

    const alerts = await Alert.findAll({
      where: { bloodBankId: bloodBankIds, status: 'pending', expiresAt: { [Sequelize.Op.gt]: new Date() } },
      include: [
        { model: BloodBank, attributes: ['hospitalName','address','phone'] },
        { model: User, as: 'doctor', attributes: ['name','hospital'] }
      ],
      order: [['urgency','DESC'], ['createdAt','DESC']]
    });

    res.json({ success: true, data: { alerts } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mettre à jour localisation
exports.updateDonorLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    req.user.latitude = latitude;
    req.user.longitude = longitude;
    await req.user.save();

    res.json({ success: true, message: 'Localisation mise à jour', data: { user: req.user } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Mettre à jour statut
exports.updateDonorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['available','unavailable'].includes(status)) return res.status(400).json({ success: false, message: 'Statut invalide.' });

    req.user.status = status;
    await req.user.save();

    res.json({ success: true, message: `Statut mis à jour: ${status}`, data: { user: req.user } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
