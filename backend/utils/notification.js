const Notification = require('../models/Notification');

// Simuler l'envoi de notifications push
const sendPushNotification = async (user, alert, type, message) => {
  try {
    let title = 'BloodLink Notification';
    
    switch (type) {
      case 'NEW_ALERT':
        title = '🚨 Nouvelle alerte de sang';
        break;
      case 'ALERT_CANCELLED':
        title = '✅ Alerte annulée';
        break;
      case 'BLOOD_REQUEST':
        title = '🏥 Demande de sang';
        break;
      case 'DONOR_ACCEPTED':
        title = '👍 Donneur disponible';
        break;
      case 'BLOOD_RECEIVED':
        title = '💉 Sang reçu';
        break;
    }

    // En développement, on simule l'envoi
    console.log(`📤 Notification to user ${user._id}: ${title} - ${message}`);

    // Sauvegarder la notification dans la base de données
    const notification = await Notification.create({
      user: user._id,
      alert: alert ? alert._id : null,
      type,
      title,
      message,
      data: {
        alertId: alert ? alert._id.toString() : null,
        bloodType: alert ? alert.bloodType : null
      }
    });

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Obtenir l'historique des notifications
const getNotificationHistory = async (userId) => {
  return await Notification.find({ user: userId })
    .populate('alert')
    .sort({ createdAt: -1 })
    .limit(50);
};

// Marquer comme lu
const markAsRead = async (notificationId) => {
  return await Notification.findByIdAndUpdate(
    notificationId, 
    { read: true },
    { new: true }
  );
};

module.exports = {
  sendPushNotification,
  getNotificationHistory,
  markAsRead
};