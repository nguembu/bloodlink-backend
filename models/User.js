// models/User.js
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../db');
const bcrypt = require('bcryptjs');

class User extends Model {
  async correctPassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

User.init({
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('donor','doctor'), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  bloodType: { type: DataTypes.ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') },
  status: { type: DataTypes.ENUM('available','unavailable'), defaultValue: 'available' },
  medicalHistory: { type: DataTypes.TEXT, defaultValue: '' },
  latitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  longitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  hospital: { type: DataTypes.STRING },
  cni: { type: DataTypes.STRING },
  licenseNumber: { type: DataTypes.STRING },
  fcmToken: { type: DataTypes.STRING },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin: { type: DataTypes.DATE }
}, {
  sequelize,
  modelName: 'User',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

// Méthode pour mettre à jour localisation
User.prototype.updateLocation = async function(lat, lon) {
  this.latitude = lat;
  this.longitude = lon;
  return this.save();
};

module.exports = User;
