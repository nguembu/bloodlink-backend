const { DataTypes, Model } = require('sequelize');
const sequelize = require('./db');
const User = require('./User');
const { Alert } = require('./Alert');

class Notification extends Model {}

Notification.init({
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, allowNull: false },
  alertId: { type: DataTypes.INTEGER, references: { model: Alert, key: 'id' } },
  type: { type: DataTypes.ENUM('NEW_ALERT','ALERT_CANCELLED','BLOOD_REQUEST','DONOR_ACCEPTED','BLOOD_RECEIVED'), allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  data: { type: DataTypes.JSON, defaultValue: {} },
  read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  sequelize,
  modelName: 'Notification'
});

module.exports = Notification;
