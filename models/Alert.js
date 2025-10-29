const { DataTypes, Model } = require('sequelize');
const sequelize = require('./db');
const User = require('./User');
const BloodBank = require('./BloodBank');

class Alert extends Model {
  async cancel() {
    this.status = 'cancelled';
    await this.save();
  }

  async fulfill() {
    this.status = 'fulfilled';
    await this.save();
  }

  async acceptDonor(donorId) {
    this.acceptedDonorId = donorId;
    this.status = 'fulfilled';
    await this.save();
  }
}

Alert.init({
  doctorId: { type: DataTypes.INTEGER, allowNull: false, references: { model: User, key: 'id' } },
  bloodBankId: { type: DataTypes.INTEGER, allowNull: false, references: { model: BloodBank, key: 'id' } },
  bloodType: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  urgency: { type: DataTypes.ENUM('low', 'medium', 'high', 'critical'), defaultValue: 'medium' },
  status: { type: DataTypes.ENUM('pending','approved','rejected','fulfilled','cancelled'), defaultValue: 'pending' },
  patientName: DataTypes.STRING,
  patientAge: DataTypes.INTEGER,
  patientCondition: DataTypes.STRING,
  acceptedDonorId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  expiresAt: { type: DataTypes.DATE, defaultValue: () => new Date(Date.now() + 24*60*60*1000) }
}, {
  sequelize,
  modelName: 'Alert'
});

// Table pour les réponses des donneurs
const AlertResponse = sequelize.define('AlertResponse', {
  alertId: { type: DataTypes.INTEGER, references: { model: Alert, key: 'id' } },
  donorId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' } },
  status: { type: DataTypes.ENUM('pending','accepted','declined'), defaultValue: 'pending' },
  message: DataTypes.TEXT,
  respondedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

Alert.hasMany(AlertResponse, { foreignKey: 'alertId' });
AlertResponse.belongsTo(Alert, { foreignKey: 'alertId' });
User.hasMany(AlertResponse, { foreignKey: 'donorId' });
AlertResponse.belongsTo(User, { foreignKey: 'donorId' });

module.exports = { Alert, AlertResponse };
