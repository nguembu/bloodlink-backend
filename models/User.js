const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('./db');

class User extends Model {
  async correctPassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  async updateLocation(latitude, longitude) {
    this.latitude = latitude;
    this.longitude = longitude;
    await this.save();
  }
}

User.init({
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('donor', 'doctor'), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  bloodType: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') },
  status: { type: DataTypes.ENUM('available', 'unavailable'), defaultValue: 'available' },
  medicalHistory: { type: DataTypes.TEXT, defaultValue: '' },
  latitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  longitude: { type: DataTypes.FLOAT, defaultValue: 0 },
  hospital: DataTypes.STRING,
  cni: DataTypes.STRING,
  licenseNumber: DataTypes.STRING,
  fcmToken: DataTypes.STRING,
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  lastLogin: DataTypes.DATE
}, {
  sequelize,
  modelName: 'User',
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

module.exports = User;
