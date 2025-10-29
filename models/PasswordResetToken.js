const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User');
const crypto = require('crypto');

class PasswordResetToken extends Model {
  static async generateToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1*60*60*1000);
    return this.create({ userId, token, expiresAt });
  }

  static async verifyToken(token) {
    return this.findOne({
      where: { token, expiresAt: { [sequelize.Op.gt]: new Date() } },
      include: [{ model: User, as: 'user' }]
    });
  }
}

PasswordResetToken.init({
  token: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
}, { sequelize, modelName: 'PasswordResetToken', timestamps: true });

PasswordResetToken.belongsTo(User, { as: 'user' });

module.exports = PasswordResetToken;
