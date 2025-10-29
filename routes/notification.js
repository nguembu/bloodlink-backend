const express = require('express');
const { protectUser } = require('../middleware/auth');
const { 
  getNotificationHistory, 
  markAsRead
} = require('../utils/notification');

const router = express.Router();

// Toutes les routes protégées pour les Users
router.use(protectUser);

// Obtenir l'historique des notifications
router.get('/history', async (req, res) => {
  try {
    const notifications = await getNotificationHistory(req.user.id);
    
    res.json({
      success: true,
      data: { notifications }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    });
  }
});

// Marquer une notification comme lue
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await markAsRead(req.params.id);
    
    if (notification) {
      res.json({
        success: true,
        message: 'Notification marquée comme lue',
        data: { notification }
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la notification'
    });
  }
});

// Mettre à jour le token FCM
router.post('/fcm-token', async (req, res) => {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'Token FCM requis'
      });
    }

    req.user.fcmToken = fcmToken;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Token FCM mis à jour avec succès'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Erreur lors de la mise à jour du token FCM'
    });
  }
});

module.exports = router;