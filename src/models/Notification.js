const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like','comment','reply','mention','follow','mod_approved','mod_rejected','report_update','announcement','medal'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  relatedId: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Notification', notificationSchema);
