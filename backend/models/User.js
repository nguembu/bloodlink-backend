const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['donor', 'doctor'], // Retirer bloodbank
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  // Champs spécifiques aux donneurs
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: function() { return this.role === 'donor'; }
  },
  status: {
    type: String,
    enum: ['available', 'unavailable'],
    default: 'available'
  },
  medicalHistory: {
    type: String,
    default: ''
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  // Champs spécifiques aux médecins
  hospital: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  cni: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  licenseNumber: {
    type: String,
    required: function() { return this.role === 'doctor'; }
  },
  // Champs généraux
  fcmToken: String,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
});

// Index pour les recherches géospatiales
userSchema.index({ location: '2dsphere' });
userSchema.index({ role: 1 });
userSchema.index({ bloodType: 1 });

// Middleware de hachage du mot de passe
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Méthode pour vérifier le mot de passe
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour mettre à jour la localisation
userSchema.methods.updateLocation = function(latitude, longitude) {
  this.location = {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
  return this.save();
};

module.exports = mongoose.model('User', userSchema);