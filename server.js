/**
 * 🩸 BLOODLINK BACKEND - Serveur Express
 * Optimisé pour le déploiement sur Render et le développement local
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db'); // SQLite database
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
// 💚 Route de santé
// ================================
app.get('/api/health', (req, res) => {
  const port = process.env.PORT || 5000;
  const localIP = process.env.LOCAL_IP || '192.168.1.100';

  res.json({
    success: true,
    message: '🩸 BloodLink API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    clientIP: req.ip,
    clientOrigin: req.get('origin'),
    urls: {
      local: `http://localhost:${port}`,
      network: `http://${localIP}:${port}`,
      render: process.env.RENDER_EXTERNAL_URL || 'https://bloodlink-backend-ytdc.onrender.com',
    },
  });
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
  });
});

// ================================
// 💥 Gestion d'erreurs globales
// ================================
app.use((err, req, res, next) => {
  console.error('💥 Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ================================
// 🧠 Initialisation SQLite
// ================================
try {
  console.log('✅ SQLite database ready');
} catch (err) {
  console.error('❌ Erreur SQLite:', err.message);
  process.exit(1);
}

// ================================
// 🚀 Démarrage serveur
// ================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n🚀 BLOODLINK BACKEND DÉMARRÉ');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Backend: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}\n`);
});

// Arrêt propre
const shutdown = () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ================================
// ✅ Export app
// ================================
module.exports = app;
