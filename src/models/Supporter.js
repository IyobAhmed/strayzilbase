const mongoose = require('mongoose');
const supporterSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  displayOrder: { type: Number, default: 0 },
  contribution: { type: String, maxlength: 200, default: '' },
  featured: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model('Supporter', supporterSchema);
