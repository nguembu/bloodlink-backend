const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware CORS complet
app.use(cors({
  origin: '*', // Autoriser toutes les origins en développement
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin')
  });
  next();
});

// Middleware pour parser le JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Gérer les pré-vol CORS
app.options('*', cors());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/bloodbanks', require('./routes/bloodBanks'));
app.use('/api/notifications', require('./routes/notification'));

// Routes de santé et test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'BloodLink API is running!',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    clientHost: req.get('host'),
    clientOrigin: req.get('origin'),
    serverURLs: {
      local: `http://localhost:${process.env.PORT || 5000}`,
      network: `http://192.168.4.48:${process.env.PORT || 5000}`,
      docker: `http://172.17.0.1:${process.env.PORT || 5000}`
    }
  });
});

// Route de test pour vérifier l'authentification
app.get('/api/auth/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Route de test CORS
app.get('/api/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test successful!',
    headers: {
      origin: req.get('origin'),
      'user-agent': req.get('user-agent')
    }
  });
});

// Middleware pour servir les fichiers statics (si nécessaire)
app.use('/public', express.static('public'));

// Gestion des erreurs 404
app.use('*', (req, res) => {
  console.log(`❌ 404 - Route non trouvée: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée.',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/auth/test',
      'GET /api/cors-test',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/bloodbank/register',
      'POST /api/auth/bloodbank/login'
    ]
  });
});

// Middleware de gestion d'erreurs global
app.use((error, req, res, next) => {
  console.error('💥 Erreur globale:', error);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong!'
  });
});

// Connexion à la base de données
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bloodlink';

console.log('🔗 Tentative de connexion à MongoDB...');
console.log('📊 URI MongoDB:', MONGO_URI.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://***:***@'));

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ Connecté à la base de données MongoDB');
    console.log('📁 Base de données:', mongoose.connection.db.databaseName);
    console.log('👥 Collections:', Object.keys(mongoose.connection.collections));
    
    // Démarrer le serveur
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 ===== SERVEUR BLOODLINK DÉMARRÉ =====');
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏠 Local: http://localhost:${PORT}`);
      console.log(`📱 Réseau: http://192.168.4.48:${PORT}`);
      console.log(`🐳 Docker: http://172.17.0.1:${PORT}`);
      console.log('====================================\n');
      
      // Afficher les routes disponibles
      console.log('🛣️  Routes disponibles:');
      console.log('   GET  /api/health          - Test de santé');
      console.log('   GET  /api/auth/test       - Test auth');
      console.log('   GET  /api/cors-test       - Test CORS');
      console.log('   POST /api/auth/register   - Inscription user');
      console.log('   POST /api/auth/login      - Connexion user');
      console.log('   POST /api/auth/bloodbank/register - Inscription bloodbank');
      console.log('   POST /api/auth/bloodbank/login    - Connexion bloodbank');
      console.log('');
    });

    // Gestion propre de l'arrêt
    const gracefulShutdown = () => {
      console.log('\n🛑 Reception du signal d\'arrêt...');
      server.close(() => {
        console.log('✅ Serveur HTTP arrêté');
        mongoose.connection.close(false, () => {
          console.log('✅ Connexion MongoDB fermée');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    // Gestion des erreurs non catchées
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Rejet non géré:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('💥 Exception non catchée:', error);
      process.exit(1);
    });

  })
  .catch(err => {
    console.error('❌ Erreur de connexion à MongoDB:', err.message);
    console.log('💡 Vérifiez que:');
    console.log('   • MongoDB est installé et démarré');
    console.log('   • L\'URI MongoDB est correcte');
    console.log('   • La base de données "bloodlink" existe');
    process.exit(1);
  });

// Test de connexion MongoDB
mongoose.connection.on('error', err => {
  console.error('❌ Erreur MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Déconnecté de MongoDB');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔁 Reconnexion à MongoDB réussie');
});

module.exports = app;