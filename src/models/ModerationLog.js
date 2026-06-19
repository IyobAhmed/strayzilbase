const mongoose = require('mongoose');
const moderationLogSchema = new mongoose.Schema({
  moderator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['ban','unban','mute','unmute','warn','delete_content','delete_message','edit_content','approve_mod','reject_mod','feature_mod','grant_medal','remove_medal','upgrade_rank'], required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetType: { type: String, enum: ['user','post','comment','mod','message','wiki','news'] },
  targetId: { type: String },
  reason: { type: String, maxlength: 500 },
  details: { type: String, maxlength: 1000 }
}, { timestamps: true });
module.exports = mongoose.model('ModerationLog', moderationLogSchema);
