// models/AlertResponse.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const Alert = require('./Alert');

class AlertResponse extends Model {}

AlertResponse.init({
  status: { type: DataTypes.ENUM('pending','accepted','declined'), defaultValue: 'pending' },
  message: DataTypes.STRING,
  respondedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'AlertResponse', timestamps: true });

AlertResponse.belongsTo(User, { as: 'donor' });
AlertResponse.belongsTo(Alert, { foreignKey: 'alertId' });

module.exports = AlertResponse;
