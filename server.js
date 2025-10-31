/**
 * 🩸 BLOODLINK BACKEND - Serveur Express
 * Optimisé pour le déploiement sur Render et le développement local
 * AVEC ARCHITECTURE MVVM ET MODÈLES CORRIGÉS
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // Import depuis le nouvel index
const app = express();

// ================================
// 🌍 Configuration CORS
// ================================
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'exp://', // Expo mobile local
  'https://bloodlink-frontend.vercel.app',
  process.env.FRONTEND_URL,
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((allowed) => origin.startsWith(allowed))) {
        callback(null, true);
      } else {
        console.warn('🚫 CORS refusé pour:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ================================
// 🧾 Middleware
// ================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger basique
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.originalUrl} - ${req.ip}`);
  next();
});

// ================================
// 📦 Routes principales
// ================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/bloodbanks', require('./routes/bloodBanks'));
app.use('/api/notifications', require('./routes/notification'));

// ================================
// 💚 Route de santé améliorée
// ================================
app.get('/api/health', async (req, res) => {
  try {
    // Test de la connexion à la base de données
    await sequelize.authenticate();
    
    const port = process.env.PORT || 5000;
    const localIP = process.env.LOCAL_IP || '192.168.1.100';

    res.json({
      success: true,
      message: '🩸 BloodLink API is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: '✅ Connecté',
        dialect: 'SQLite',
        storage: process.env.NODE_ENV === 'production' ? '/tmp/database.sqlite' : './config/database.sqlite'
      },
      clientIP: req.ip,
      clientOrigin: req.get('origin'),
      urls: {
        local: `http://localhost:${port}`,
        network: `http://${localIP}:${port}`,
        render: process.env.RENDER_EXTERNAL_URL || 'https://bloodlink-backend-ytdc.onrender.com',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Problème de connexion à la base de données',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ================================
// 🧪 Route de test des modèles
// ================================
app.get('/api/test-models', async (req, res) => {
  try {
    const { User, Alert, BloodBank, AlertResponse, Notification } = require('./models');
    
    // Compter les enregistrements dans chaque table
    const usersCount = await User.count();
    const alertsCount = await Alert.count();
    const bloodBanksCount = await BloodBank.count();
    const responsesCount = await AlertResponse.count();
    const notificationsCount = await Notification.count();

    res.json({
      success: true,
      message: '✅ Tous les modèles sont fonctionnels',
      database: {
        status: '✅ Synchronisée',
        models: {
          User: '✅ OK',
          Alert: '✅ OK', 
          BloodBank: '✅ OK',
          AlertResponse: '✅ OK',
          Notification: '✅ OK'
        }
      },
      counts: {
        users: usersCount,
        alerts: alertsCount,
        bloodBanks: bloodBanksCount,
        alertResponses: responsesCount,
        notifications: notificationsCount
      },
      associations: '✅ Configurées dans models/index.js',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '❌ Erreur avec les modèles',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ================================
// 🚦 Gestion 404
// ================================
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route inconnue: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    availableRoutes: [
      '/api/health',
      '/api/test-models', 
      '/api/auth/*',
      '/api/alerts/*',
      '/api/donors/*',
      '/api/bloodbanks/*',
      '/api/notifications/*'
    ]
  });
});

// ================================
// 💥 Gestion d'erreurs globales
// ================================
app.use((err, req, res, next) => {
  console.error('💥 Erreur serveur:', err);
  
  // Erreur de validation Sequelize
  if (err.name && err.name.includes('Sequelize')) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Données invalides',
      details: process.env.NODE_ENV === 'development' ? err.errors : undefined
    });
  }
  
  // Erreur CORS
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit par la politique CORS'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ================================
// 🧠 Initialisation et synchronisation de la base de données
// ================================
const initializeDatabase = async () => {
  try {
    console.log('🔄 Initialisation de la base de données...');
    
    // Test de connexion
    await sequelize.authenticate();
    console.log('✅ Connexion à SQLite établie');
    
    // Synchronisation des modèles
    await sequelize.sync({ 
      force: false, // Ne jamais mettre à true en production!
      alter: process.env.NODE_ENV === 'development' // Mise à jour du schéma en dev
    });
    console.log('✅ Modèles synchronisés avec la base de données');
    
    // Vérification des tables
    const tables = await sequelize.showAllSchemas();
    console.log('📊 Tables disponibles:', tables);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    
    // Tentative de récupération pour les erreurs spécifiques
    if (error.name === 'SequelizeConnectionError') {
      console.error('🔌 Vérifiez la configuration de la base de données');
    } else if (error.name === 'SequelizeValidationError') {
      console.error('📝 Erreur de validation des modèles');
    }
    
    process.exit(1);
  }
};

// ================================
// 🚀 Démarrage serveur
// ================================
const startServer = async () => {
  try {
    // Initialiser la base de données d'abord
    await initializeDatabase();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 BLOODLINK BACKEND DÉMARRÉ AVEC SUCCÈS');
      console.log('='.repeat(50));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Base de données: SQLite (${process.env.NODE_ENV === 'production' ? '/tmp/database.sqlite' : 'locale'})`);
      console.log(`🔗 Backend URL: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}`);
      console.log(`🏥 Endpoints de test:`);
      console.log(`   • Santé: http://localhost:${PORT}/api/health`);
      console.log(`   • Modèles: http://localhost:${PORT}/api/test-models`);
      console.log('='.repeat(50) + '\n');
    });

    // Gestion des erreurs du serveur
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé`);
      } else {
        console.error('❌ Erreur du serveur:', error);
      }
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('❌ Impossible de démarrer le serveur:', error);
    process.exit(1);
  }
};

// ================================
// 🛑 Arrêt propre
// ================================
const shutdown = async (signal) => {
  console.log(`\n📡 Signal ${signal} reçu, arrêt en cours...`);
  
  try {
    await sequelize.close();
    console.log('✅ Connexion à la base de données fermée');
    
    if (server) {
      server.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'arrêt:', error);
    process.exit(1);
  }
};

// Gestionnaires de signaux
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (error) => {
  console.error('💥 Exception non capturée:', error);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Rejet non géré:', reason);
  shutdown('unhandledRejection');
});

// ================================
// 🏁 Démarrage de l'application
// ================================
let server;

startServer()
  .then((s) => {
    server = s;
  })
  .catch((error) => {
    console.error('❌ Échec du démarrage:', error);
    process.exit(1);
  });

// ================================
// ✅ Export app pour les tests
// ================================
module.exports = app;