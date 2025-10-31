// models/Alert.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Alert extends Model {
  async cancel() { 
    this.status = 'cancelled'; 
    return this.save(); 
  }
  
  async fulfill() { 
    this.status = 'fulfilled'; 
    return this.save(); 
  }
  
  async acceptDonor(donorId) {
    this.acceptedDonorId = donorId;
    this.status = 'fulfilled';
    return this.save();
  }
}

Alert.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bloodType: { 
    type: DataTypes.ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-'), 
    allowNull: false 
  },
  quantity: { 
    type: DataTypes.INTEGER, 
    allowNull: false 
  },
  urgency: { 
    type: DataTypes.ENUM('low','medium','high','critical'), 
    defaultValue: 'medium' 
  },
  status: { 
    type: DataTypes.ENUM('pending','approved','rejected','fulfilled','cancelled'), 
    defaultValue: 'pending' 
  },
  patientName: DataTypes.STRING,
  patientAge: DataTypes.INTEGER,
  patientCondition: DataTypes.STRING,
  expiresAt: { 
    type: DataTypes.DATE, 
    defaultValue: () => new Date(Date.now() + 24*60*60*1000) 
  },
  // Ajouter explicitement les clés étrangères
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  bloodBankId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bloodbanks',
      key: 'id'
    }
  },
  acceptedDonorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, { 
  sequelize, 
  modelName: 'Alert',
  tableName: 'alerts',
  timestamps: true 
});

module.exports = Alert;