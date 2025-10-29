const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const bloodBankSchema = new mongoose.Schema({
  hospitalName: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false,
      default: [0, 0]
    }
  },
  address: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  bloodInventory: {
    'A+': { type: Number, default: 0 },
    'A-': { type: Number, default: 0 },
    'B+': { type: Number, default: 0 },
    'B-': { type: Number, default: 0 },
    'AB+': { type: Number, default: 0 },
    'AB-': { type: Number, default: 0 },
    'O+': { type: Number, default: 0 },
    'O-': { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

bloodBankSchema.index({ location: '2dsphere' });

// Middleware de hachage du mot de passe
bloodBankSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Méthode pour vérifier la disponibilité du sang
bloodBankSchema.methods.hasBloodAvailable = function(bloodType, quantity = 1) {
  return this.bloodInventory[bloodType] >= quantity;
};

// Méthode pour mettre à jour l'inventaire
bloodBankSchema.methods.updateInventory = function(bloodType, quantity) {
  this.bloodInventory[bloodType] += quantity;
  return this.save();
};

module.exports = mongoose.model('BloodBank', bloodBankSchema);