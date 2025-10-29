const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodBank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BloodBank',
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'fulfilled', 'cancelled'],
    default: 'pending'
  },
  patientInfo: {
    name: String,
    age: Number,
    condition: String
  },
  // Réponses des donneurs
  responses: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined']
    },
    respondedAt: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  // Donneur qui a accepté l'alerte
  acceptedDonor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 heures
  }
}, {
  timestamps: true
});

// Index pour les recherches
alertSchema.index({ status: 1 });
alertSchema.index({ bloodType: 1 });
alertSchema.index({ doctor: 1 });
alertSchema.index({ bloodBank: 1 });

// Méthode pour annuler l'alerte
alertSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Méthode pour valider la réception
alertSchema.methods.fulfill = function() {
  this.status = 'fulfilled';
  return this.save();
};

// Méthode pour accepter un donneur et annuler pour les autres
alertSchema.methods.acceptDonor = function(donorId) {
  this.acceptedDonor = donorId;
  this.status = 'fulfilled'; // On marque comme rempli dès qu'un donneur accepte
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);