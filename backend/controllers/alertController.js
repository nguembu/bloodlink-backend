const Alert = require('../models/Alert');
const User = require('../models/User');
const BloodBank = require('../models/BloodBank');
const { findUsersInRadius } = require('../utils/geolocation');
const { sendPushNotification } = require('../utils/notification');

// Médecin : Envoyer une alerte à la banque de sang
exports.createAlert = async (req, res) => {
  try {
    const { bloodType, quantity, urgency, patientInfo } = req.body;

    if (req.user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les médecins peuvent créer des alertes.'
      });
    }

    // Trouver la banque de sang de l'hôpital du médecin
    let bloodBank = await BloodBank.findOne({ 
      hospitalName: req.user.hospital 
    });

    if (!bloodBank) {
      return res.status(404).json({
        success: false,
        message: 'Aucune banque de sang trouvée pour votre hôpital.'
      });
    }

    // Créer l'alerte
    const alert = await Alert.create({
      doctor: req.user.id,
      bloodBank: bloodBank._id,
      bloodType,
      quantity,
      urgency,
      patientInfo
    });

    res.status(201).json({
      success: true,
      message: 'Alerte créée avec succès',
      data: { alert }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Banque de sang : Notifier les donneurs
exports.notifyDonors = async (req, res) => {
  try {
    const { alertId, radius = 10 } = req.body;

    const alert = await Alert.findById(alertId).populate('bloodBank');
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée.'
      });
    }

    // Vérifier que l'utilisateur est la banque de sang concernée
    if (alert.bloodBank._id.toString() !== req.bloodBank._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé à notifier les donneurs pour cette alerte.'
      });
    }

    // Vérifier si la banque a déjà le sang
    if (req.bloodBank.hasBloodAvailable(alert.bloodType, alert.quantity)) {
      return res.status(400).json({
        success: false,
        message: 'Votre banque a déjà ce sang disponible.'
      });
    }

    // Trouver les donneurs compatibles dans le rayon
    const [bankLongitude, bankLatitude] = req.bloodBank.location.coordinates;
    const compatibleDonors = await findUsersInRadius(
      bankLatitude,
      bankLongitude,
      radius,
      alert.bloodType
    );

    // Notifier chaque donneur disponible
    let notifiedCount = 0;
    for (const donor of compatibleDonors) {
      if (donor.status === 'available') {
        await sendPushNotification(
          donor,
          alert,
          'NEW_ALERT',
          `Urgence sang ${alert.bloodType} à ${req.bloodBank.hospitalName}`
        );
        notifiedCount++;
      }
    }

    res.json({
      success: true,
      message: `${notifiedCount} donneurs notifiés avec succès.`,
      data: { notifiedCount }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Donneur : Répondre à une alerte (accepter)
exports.respondToAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { message } = req.body;

    if (req.user.role !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Seuls les donneurs peuvent répondre aux alertes.'
      });
    }

    const alert = await Alert.findById(alertId)
      .populate('bloodBank')
      .populate('doctor');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée.'
      });
    }

    // Vérifier la compatibilité du groupe sanguin
    if (req.user.bloodType !== alert.bloodType) {
      return res.status(400).json({
        success: false,
        message: 'Votre groupe sanguin ne correspond pas à celui requis.'
      });
    }

    // Vérifier si l'alerte est toujours active
    if (alert.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cette alerte n\'est plus active.'
      });
    }

    // Accepter le donneur et annuler l'alerte pour les autres
    await alert.acceptDonor(req.user.id);

    // Notifier la banque de sang
    await sendPushNotification(
      { _id: alert.bloodBank._id, email: alert.bloodBank.email },
      alert,
      'DONOR_ACCEPTED',
      `Donneur ${req.user.name} a accepté votre alerte`
    );

    // Notifier le médecin
    await sendPushNotification(
      alert.doctor,
      alert,
      'DONOR_ACCEPTED',
      `Un donneur a accepté votre demande de sang ${alert.bloodType}`
    );

    res.json({
      success: true,
      message: 'Alerte acceptée avec succès. Vous serez contacté par la banque de sang.',
      data: { alert }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Obtenir les alertes pour une banque de sang
exports.getBloodBankAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({
      bloodBank: req.bloodBank._id
    })
    .populate('doctor', 'name hospital phone')
    .populate('acceptedDonor', 'name phone bloodType')
    .sort({ createdAt: -1 });

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

// Obtenir les alertes pour un médecin
exports.getDoctorAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find({
      doctor: req.user._id
    })
    .populate('bloodBank', 'hospitalName address phone')
    .populate('acceptedDonor', 'name phone bloodType')
    .sort({ createdAt: -1 });

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