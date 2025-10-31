// models/index.js
const sequelize = require('../config/db');
const User = require('./User');
const Alert = require('./Alert');
const BloodBank = require('./BloodBank');
const AlertResponse = require('./AlertResponse');
const Notification = require('./Notification');

// Définir toutes les associations ici pour éviter les dépendances circulaires

// User associations
User.hasMany(Alert, { 
  foreignKey: 'doctorId',
  as: 'createdAlerts'
});

User.hasMany(AlertResponse, {
  foreignKey: 'donorId',
  as: 'alertResponses'
});

User.hasMany(Notification, {
  foreignKey: 'userId',
  as: 'notifications'
});

// Alert associations
Alert.belongsTo(User, { 
  foreignKey: 'doctorId',
  as: 'doctor'
});

Alert.belongsTo(BloodBank, { 
  foreignKey: 'bloodBankId',
  as: 'bloodBank'
});

Alert.belongsTo(User, { 
  foreignKey: 'acceptedDonorId',
  as: 'acceptedDonor'
});

Alert.hasMany(AlertResponse, { 
  foreignKey: 'alertId',
  as: 'responses'
});

Alert.hasMany(Notification, {
  foreignKey: 'alertId',
  as: 'notifications'
});

// BloodBank associations
BloodBank.hasMany(Alert, {
  foreignKey: 'bloodBankId',
  as: 'alerts'
});

// AlertResponse associations
AlertResponse.belongsTo(User, { 
  foreignKey: 'donorId',
  as: 'donor'
});

AlertResponse.belongsTo(Alert, { 
  foreignKey: 'alertId'
});

// Notification associations
Notification.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

Notification.belongsTo(Alert, { 
  foreignKey: 'alertId',
  as: 'alert'
});

const models = {
  sequelize,
  User,
  Alert,
  BloodBank,
  AlertResponse,
  Notification
};

module.exports = models;