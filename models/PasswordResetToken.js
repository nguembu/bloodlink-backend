const { DataTypes, Model } = require('sequelize');
const sequelize = require('./db');
const crypto = require('crypto');
const User = require('./User');

class PasswordResetToken extends Model {
  static async generateToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60*60*1000);
    return await this.create({ userId, token, expiresAt });
  }

  static async verifyToken(token) {
    const record = await this.findOne({ where: { token, expiresAt: { [sequelize.Op.gt]: new Date() } } });
    return record;
  }
}

PasswordResetToken.init({
  userId: { type: DataTypes.INTEGER, references: { model: User, key: 'id' }, allowNull: false },
  token: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false }
}, {
  sequelize,
  modelName: 'PasswordResetToken'
});

module.exports = PasswordResetToken;
