const { Alert, User, BloodBank } = require('../models');
const { findUsersInRadius } = require('../utils/geolocation');
const { sendPushNotification } = require('../utils/notification');
const { Op } = require('sequelize');

// Médecin : créer une alerte
exports.createAlert = async (req, res) => {
  try {
    const { bloodType, quantity, urgency, patientInfo } = req.body;
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Seuls les médecins peuvent créer des alertes.' });
    }

    const bloodBank = await BloodBank.findOne({ where: { hospitalName: req.user.hospital } });
    if (!bloodBank) return res.status(404).json({ success: false, message: 'Banque de sang non trouvée pour votre hôpital.' });

    const alert = await Alert.create({
      doctorId: req.user.id,
      bloodBankId: bloodBank.id,
      bloodType,
      quantity,
      urgency,
      patientInfo: JSON.stringify(patientInfo),
      status: 'pending',
      expiresAt: new Date(Date.now() + 24*60*60*1000)
    });

    res.status(201).json({ success: true, message: 'Alerte créée', data: { alert } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Banque de sang : notifier les donneurs
exports.notifyDonors = async (req, res) => {
  try {
    const { alertId, radius = 10 } = req.body;

    const alert = await Alert.findByPk(alertId, { include: BloodBank });
    if (!alert) return res.status(404).json({ success: false, message: 'Alerte non trouvée.' });
    if (alert.BloodBank.id !== req.bloodBank.id) {
      return res.status(403).json({ success: false, message: 'Non autorisé à notifier pour cette alerte.' });
    }

    // Vérifier inventaire
    if (req.bloodBank.bloodInventory[alert.bloodType] >= alert.quantity) {
      return res.status(400).json({ success: false, message: 'Sang déjà disponible.' });
    }

    // Chercher donneurs compatibles
    const compatibleDonors = await findUsersInRadius(
      req.bloodBank.latitude,
      req.bloodBank.longitude,
      radius,
      alert.bloodType
    );

    let notifiedCount = 0;
    for (const donor of compatibleDonors) {
      if (donor.status === 'available') {
        await sendPushNotification(donor, alert, 'NEW_ALERT', `Urgence sang ${alert.bloodType} à ${req.bloodBank.hospitalName}`);
        notifiedCount++;
      }
    }

    res.json({ success: true, message: `${notifiedCount} donneurs notifiés`, data: { notifiedCount } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Donneur : accepter une alerte
exports.respondToAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { message } = req.body;
    if (req.user.role !== 'donor') return res.status(403).json({ success: false, message: 'Seuls les donneurs peuvent répondre.' });

    const alert = await Alert.findByPk(alertId, { include: ['BloodBank', { model: User, as: 'doctor' }] });
    if (!alert) return res.status(404).json({ success: false, message: 'Alerte non trouvée.' });
    if (alert.bloodType !== req.user.bloodType) return res.status(400).json({ success: false, message: 'Groupe sanguin incompatible.' });
    if (alert.status !== 'pending') return res.status(400).json({ success: false, message: 'Alerte inactive.' });

    // Accepter le donneur
    alert.acceptedDonorId = req.user.id;
    alert.status = 'fulfilled';
    await alert.save();

    // Notifier banque et médecin
    await sendPushNotification({ id: alert.BloodBank.id, email: alert.BloodBank.email }, alert, 'DONOR_ACCEPTED', `Donneur ${req.user.name} a accepté l'alerte`);
    await sendPushNotification(alert.doctor, alert, 'DONOR_ACCEPTED', `Un donneur a accepté votre demande de sang ${alert.bloodType}`);

    res.json({ success: true, message: 'Alerte acceptée. La banque vous contactera.', data: { alert } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Obtenir alertes pour une banque de sang
exports.getBloodBankAlerts = async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: { bloodBankId: req.bloodBank.id },
      include: [
        { model: User, as: 'doctor', attributes: ['name','hospital','phone'] },
        { model: User, as: 'acceptedDonor', attributes: ['name','phone','bloodType'] }
      ],
      order: [['createdAt','DESC']]
    });

    res.json({ success: true, data: { alerts } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Obtenir alertes pour un médecin
exports.getDoctorAlerts = async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: { doctorId: req.user.id },
      include: [
        { model: BloodBank, attributes: ['hospitalName','address','phone'] },
        { model: User, as: 'acceptedDonor', attributes: ['name','phone','bloodType'] }
      ],
      order: [['createdAt','DESC']]
    });

    res.json({ success: true, data: { alerts } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
