// models/AlertResponse.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class AlertResponse extends Model {}

AlertResponse.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  status: { 
    type: DataTypes.ENUM('pending','accepted','declined'), 
    defaultValue: 'pending' 
  },
  message: DataTypes.STRING,
  respondedAt: { 
    type: DataTypes.DATE, 
    defaultValue: DataTypes.NOW 
  },
  // Ajouter explicitement les clés étrangères
  donorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  alertId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'alerts',
      key: 'id'
    }
  }
}, { 
  sequelize, 
  modelName: 'AlertResponse', 
  tableName: 'alert_responses',
  timestamps: true 
});

module.exports = AlertResponse;