const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  alert: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert'
  },
  type: {
    type: String,
    required: true,
    enum: ['NEW_ALERT', 'ALERT_CANCELLED', 'BLOOD_REQUEST', 'DONOR_ACCEPTED', 'BLOOD_RECEIVED']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);