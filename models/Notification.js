// models/Notification.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Notification extends Model {}

Notification.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  type: { 
    type: DataTypes.ENUM('NEW_ALERT','ALERT_CANCELLED','BLOOD_REQUEST','DONOR_ACCEPTED','BLOOD_RECEIVED'), 
    allowNull: false 
  },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  data: { type: DataTypes.JSON, defaultValue: {} },
  read: { type: DataTypes.BOOLEAN, defaultValue: false },
  // Ajouter explicitement les clés étrangères
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  alertId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'alerts',
      key: 'id'
    }
  }
}, { 
  sequelize, 
  modelName: 'Notification',
  tableName: 'notifications',
  timestamps: true 
});

module.exports = Notification;