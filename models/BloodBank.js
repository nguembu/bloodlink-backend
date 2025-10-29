const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('./db');

class BloodBank extends Model {
  hasBloodAvailable(bloodType, quantity = 1) {
    return this[bloodType] >= quantity;
  }

  async updateInventory(bloodType, quantity) {
    this[bloodType] += quantity;
    await this.save();
  }
}

BloodBank.init({
  hospitalName: { type: DataTypes.STRING, allowNull: false, unique: true },
  latitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  longitude: { type: DataTypes.FLOAT, defaultValue: 0 },
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
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  sequelize,
  modelName: 'BloodBank',
  hooks: {
    beforeCreate: async (bank) => {
      bank.password = await bcrypt.hash(bank.password, 12);
    },
    beforeUpdate: async (bank) => {
      if (bank.changed('password')) {
        bank.password = await bcrypt.hash(bank.password, 12);
      }
    }
  }
});

module.exports = BloodBank;
