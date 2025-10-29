// models/Alert.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');
const User = require('./User');
const BloodBank = require('./BloodBank');
const AlertResponse = require('./AlertResponse');

class Alert extends Model {
  async cancel() { this.status = 'cancelled'; return this.save(); }
  async fulfill() { this.status = 'fulfilled'; return this.save(); }
  async acceptDonor(donorId) {
    this.acceptedDonorId = donorId;
    this.status = 'fulfilled';
    return this.save();
  }
}

Alert.init({
  bloodType: { type: DataTypes.ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  urgency: { type: DataTypes.ENUM('low','medium','high','critical'), defaultValue: 'medium' },
  status: { type: DataTypes.ENUM('pending','approved','rejected','fulfilled','cancelled'), defaultValue: 'pending' },
  patientName: DataTypes.STRING,
  patientAge: DataTypes.INTEGER,
  patientCondition: DataTypes.STRING,
  expiresAt: { type: DataTypes.DATE, defaultValue: () => new Date(Date.now() + 24*60*60*1000) }
}, { sequelize, modelName: 'Alert', timestamps: true });

// Associations
Alert.belongsTo(User, { as: 'doctor' });
Alert.belongsTo(BloodBank, { as: 'bloodBank' });
Alert.belongsTo(User, { as: 'acceptedDonor' });
Alert.hasMany(AlertResponse, { as: 'responses', foreignKey: 'alertId' });

module.exports = Alert;
