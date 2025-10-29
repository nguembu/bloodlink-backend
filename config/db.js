const { Sequelize } = require('sequelize');
const path = require('path');

// Crée la connexion SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'), // fichier SQLite local
  logging: false // mettre à true pour debug SQL
});

// Test de connexion
sequelize.authenticate()
  .then(() => console.log('✅ SQLite connecté'))
  .catch(err => console.error('❌ Impossible de se connecter à SQLite:', err));

module.exports = sequelize;
