const { BloodBank } = require('../models');

// Mettre à jour inventaire
exports.updateInventory = async (req, res) => {
  try {
    const { bloodType, quantity } = req.body;
    if (!bloodType || quantity === undefined) return res.status(400).json({ success: false, message: 'Type et quantité requis.' });

    req.bloodBank[bloodType] += quantity;
    await req.bloodBank.save();

    res.json({ success: true, message: 'Inventaire mis à jour', data: { bloodBank: req.bloodBank } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Obtenir inventaire
exports.getInventory = async (req, res) => {
  res.json({ success: true, data: { inventory: req.bloodBank.bloodInventory, bloodBank: { hospitalName: req.bloodBank.hospitalName, address: req.bloodBank.address, phone: req.bloodBank.phone } } });
};

// Profil banque
exports.getBloodBankProfile = async (req, res) => {
  res.json({ success: true, data: { bloodBank: req.bloodBank } });
};

// Banques à proximité (publique)
exports.findNearbyBloodBanks = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 50 } = req.query;
    if (!latitude || !longitude) return res.status(400).json({ success: false, message: 'Latitude et longitude requises.' });

    const bloodBanks = await BloodBank.findAll({
      where: { latitude: { [Sequelize.Op.between]: [latitude-maxDistance, latitude+maxDistance] }, longitude: { [Sequelize.Op.between]: [longitude-maxDistance, longitude+maxDistance] }, isActive: true },
      attributes: { exclude: ['password'] }
    });

    res.json({ success: true, data: { bloodBanks } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
