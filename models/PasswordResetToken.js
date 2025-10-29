// models/PasswordResetToken.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Générer un token
passwordResetTokenSchema.statics.generateToken = function(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 heure
  
  return this.create({
    userId,
    token,
    expiresAt
  });
};

// Vérifier si le token est valide
passwordResetTokenSchema.statics.verifyToken = async function(token) {
  const resetToken = await this.findOne({ 
    token, 
    expiresAt: { $gt: new Date() } 
  }).populate('userId');
  
  return resetToken;
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);