const mongoose = require('mongoose');
const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['user','post','comment','mod','message'], required: true },
  targetId: { type: String, required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: { type: String, required: true, enum: ['spam','harassment','inappropriate_content','cheating','other'] },
  description: { type: String, maxlength: 1000 },
  status: { type: String, enum: ['pending','reviewing','resolved','dismissed'], default: 'pending' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution: { type: String, enum: ['warned','muted','banned','content_removed','dismissed','no_action'], default: null },
  resolutionNote: { type: String, default: '' }
}, { timestamps: true });
module.exports = mongoose.model('Report', reportSchema);
