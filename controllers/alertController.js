const { Op } = require('sequelize');
const Alert = require('../models/Alert');
const AlertResponse = require('../models/AlertResponse');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const { findUsersInRadius } = require('../utils/geolocation');
const { sendPushNotification } = require('../utils/notification');

// Médecin : créer une alerte
exports.createAlert = async (req, res) => {
  try {
    const { bloodType, quantity, urgency, patientName, patientAge, patientCondition } = req.body;

    if (req.user.role !== 'doctor') return res.status(403).json({ success: false, message: 'Seuls les médecins peuvent créer des alertes.' });

    const bloodBank = await BloodBank.findOne({ where: { hospitalName: req.user.hospital } });
    if (!bloodBank) return res.status(404).json({ success: false, message: 'Aucune banque de sang trouvée pour votre hôpital.' });

    const alert = await Alert.create({
      doctorId: req.user.id,
      bloodBankId: bloodBank.id,
      bloodType,
      quantity,
      urgency,
      patientName,
      patientAge,
      patientCondition
    });

    res.status(201).json({ success: true, message: 'Alerte créée avec succès', data: { alert: { ...alert.toJSON(), _id: alert.id } } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Banque : notifier les donneurs
exports.notifyDonors = async (req, res) => {
  try {
    const { alertId, radius = 10 } = req.body;
    const alert = await Alert.findByPk(alertId, { include: [{ model: BloodBank, as: 'bloodBank' }] });
    if (!alert) return res.status(404).json({ success: false, message: 'Alerte non trouvée.' });
    if (alert.bloodBank.id !== req.bloodBank.id) return res.status(403).json({ success: false, message: 'Non autorisé.' });
    if (req.bloodBank.hasBloodAvailable(alert.bloodType, alert.quantity)) return res.status(400).json({ success: false, message: 'Sang déjà disponible.' });

    const donors = await findUsersInRadius(req.bloodBank.latitude, req.bloodBank.longitude, radius, alert.bloodType);

    let notifiedCount = 0;
    for (const donor of donors) {
      if (donor.status === 'available') {
        await sendPushNotification(donor, alert, 'NEW_ALERT', `Urgence sang ${alert.bloodType} à ${req.bloodBank.hospitalName}`);
        notifiedCount++;
      }
    }

    res.json({ success: true, message: `${notifiedCount} donneurs notifiés avec succès.`, data: { notifiedCount } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Donneur : répondre à une alerte
exports.respondToAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { message } = req.body;
    if (req.user.role !== 'donor') return res.status(403).json({ success: false, message: 'Seuls les donneurs peuvent répondre aux alertes.' });

    const alert = await Alert.findByPk(alertId, {
      include: [
        { model: BloodBank, as: 'bloodBank' },
        { model: User, as: 'doctor' },
        { model: AlertResponse, as: 'responses', include: [{ model: User, as: 'donor' }] }
      ]
    });
    if (!alert) return res.status(404).json({ success: false, message: 'Alerte non trouvée.' });
    if (req.user.bloodType !== alert.bloodType) return res.status(400).json({ success: false, message: 'Groupe sanguin incompatible.' });
    if (alert.status !== 'pending') return res.status(400).json({ success: false, message: 'Alerte non active.' });

    // Ajouter la réponse
    await AlertResponse.create({ donorId: req.user.id, alertId: alert.id, status: 'accepted', message });

    await alert.acceptDonor(req.user.id);

    await sendPushNotification({ _id: alert.bloodBank.id, email: alert.bloodBank.email }, alert, 'DONOR_ACCEPTED', `Donneur ${req.user.name} a accepté votre alerte`);
    await sendPushNotification(alert.doctor, alert, 'DONOR_ACCEPTED', `Un donneur a accepté votre demande de sang ${alert.bloodType}`);

    res.json({ success: true, message: 'Alerte acceptée avec succès.', data: { alert: { ...alert.toJSON(), _id: alert.id } } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Obtenir alertes pour banque
exports.getBloodBankAlerts = async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: { bloodBankId: req.bloodBank.id },
      include: [
        { model: User, as: 'doctor', attributes: ['id','name','hospital','phone'] },
        { model: User, as: 'acceptedDonor', attributes: ['id','name','phone','bloodType'] },
        { model: AlertResponse, as: 'responses', include: [{ model: User, as: 'donor' }] }
      ],
      order: [['createdAt','DESC']]
    });

    const alertsJson = alerts.map(a => ({ ...a.toJSON(), _id: a.id }));

    res.json({ success: true, data: { alerts: alertsJson } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Obtenir alertes pour médecin
exports.getDoctorAlerts = async (req, res) => {
  try {
    const alerts = await Alert.findAll({
      where: { doctorId: req.user.id },
      include: [
        { model: BloodBank, as: 'bloodBank', attributes: ['id','hospitalName','address','phone'] },
        { model: User, as: 'acceptedDonor', attributes: ['id','name','phone','bloodType'] },
        { model: AlertResponse, as: 'responses', include: [{ model: User, as: 'donor' }] }
      ],
      order: [['createdAt','DESC']]
    });

    const alertsJson = alerts.map(a => ({ ...a.toJSON(), _id: a.id }));

    res.json({ success: true, data: { alerts: alertsJson } });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
