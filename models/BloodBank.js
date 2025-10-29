const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

class BloodBank extends Model {
  hasBloodAvailable(bloodType, quantity = 1) {
    return this[bloodType] >= quantity;
  }
  async updateInventory(bloodType, quantity) {
    this[bloodType] = (this[bloodType] || 0) + quantity;
    return this.save();
  }
}

BloodBank.init({
  hospitalName: { type: DataTypes.STRING, allowNull: false, unique: true },
  address: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  'A+': { type: DataTypes.INTEGER, defaultValue: 0 },
  'A-': { type: DataTypes.INTEGER, defaultValue: 0 },
  'B+': { type: DataTypes.INTEGER, defaultValue: 0 },
  'B-': { type: DataTypes.INTEGER, defaultValue: 0 },
  'AB+': { type: DataTypes.INTEGER, defaultValue: 0 },
  'AB-': { type: DataTypes.INTEGER, defaultValue: 0 },
  'O+': { type: DataTypes.INTEGER, defaultValue: 0 },
  'O-': { type: DataTypes.INTEGER, defaultValue: 0 },
  latitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  longitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  sequelize,
  modelName: 'BloodBank',
  timestamps: true,
  hooks: {
    beforeCreate: async (bank) => { bank.password = await bcrypt.hash(bank.password, 12); },
    beforeUpdate: async (bank) => {
      if (bank.changed('password')) bank.password = await bcrypt.hash(bank.password, 12);
    }
  }
});

module.exports = BloodBank;
