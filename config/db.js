const { Sequelize } = require('sequelize');
const path = require('path');

// Crée la connexion SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.NODE_ENV === 'production' 
    ? '/tmp/database.sqlite' // Sur Render, utilisez /tmp
    : path.join(__dirname, 'database.sqlite'),
  logging: false // mettre à true pour debug SQL
});

// Test de connexion
sequelize.authenticate()
  .then(() => console.log('✅ SQLite connecté'))
  .catch(err => console.error('❌ Impossible de se connecter à SQLite:', err));

module.exports = sequelize;