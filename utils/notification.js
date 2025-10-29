const db = require('../config/db');

// Simuler l'envoi de notifications push
const sendPushNotification = (user, alert, type, message) => {
  const titleMap = {
    NEW_ALERT: '🚨 Nouvelle alerte de sang',
    ALERT_CANCELLED: '✅ Alerte annulée',
    BLOOD_REQUEST: '🏥 Demande de sang',
    DONOR_ACCEPTED: '👍 Donneur disponible',
    BLOOD_RECEIVED: '💉 Sang reçu'
  };
  const title = titleMap[type] || 'BloodLink Notification';

  console.log(`📤 Notification to user ${user.id}: ${title} - ${message}`);

  const data = JSON.stringify({
    alertId: alert ? alert.id : null,
    bloodType: alert ? alert.bloodType : null
  });

  const stmt = db.prepare(`
    INSERT INTO notifications (userId, alertId, type, title, message, data, read)
    VALUES (?, ?, ?, ?, ?, ?, 0)
  `);
  const info = stmt.run(user.id, alert ? alert.id : null, type, title, message, data);
  return { id: info.lastInsertRowid, userId: user.id, alertId: alert ? alert.id : null, type, title, message, data };
};

// Historique notifications
const getNotificationHistory = (userId) => {
  const stmt = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50');
  return stmt.all(userId);
};

// Marquer comme lu
const markAsRead = (notificationId) => {
  db.prepare('UPDATE notifications SET read = 1 WHERE id = ?').run(notificationId);
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(notificationId);
};

module.exports = {
  sendPushNotification,
  getNotificationHistory,
  markAsRead
};
