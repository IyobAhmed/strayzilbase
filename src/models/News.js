const mongoose = require('mongoose');
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, maxlength: 500, default: '' },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverImage: { type: String, default: '' },
  category: { type: String, enum: ['update','event','announcement','tutorial','interview','other'], default: 'update' },
  isPinned: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  scheduledAt: { type: Date, default: null },
  views: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [{ type: String, trim: true }]
}, { timestamps: true });
module.exports = mongoose.model('News', newsSchema);
