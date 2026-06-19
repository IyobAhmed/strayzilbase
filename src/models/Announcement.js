const mongoose = require('mongoose');
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 1000 },
  type: { type: String, enum: ['info','warning','success','critical'], default: 'info' },
  isActive: { type: Boolean, default: true },
  startAt: { type: Date, default: Date.now },
  endAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dismissible: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Announcement', announcementSchema);
