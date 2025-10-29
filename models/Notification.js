const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');
const Alert = require('./Alert');

class Notification extends Model {}

Notification.init({
  type: { type: DataTypes.ENUM('NEW_ALERT','ALERT_CANCELLED','BLOOD_REQUEST','DONOR_ACCEPTED','BLOOD_RECEIVED'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.STRING, allowNull: false },
  data: { type: DataTypes.JSON, defaultValue: {} },
  read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'Notification', timestamps: true });

Notification.belongsTo(User, { as: 'user' });
Notification.belongsTo(Alert, { as: 'alert' });

module.exports = Notification;
