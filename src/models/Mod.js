const mongoose = require('mongoose');
const modSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 2000 },
  shortDescription: { type: String, maxlength: 200, default: '' },
  icon: { type: String, default: '' },
  images: [{ type: String }],
  category: { type: String, enum: ['tools','weapons','blocks','mobs','dimensions','magic','tech','decoration','utility','adventure','other'], required: true },
  version: { type: String, required: true },
  minecraftVersion: { type: String, required: true },
  downloadUrl: { type: String, default: '' },
  fileSize: { type: String, default: '' },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0 },
  ratings: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, value: { type: Number, min: 1, max: 5 }, createdAt: { type: Date, default: Date.now } }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending','approved','rejected','featured'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  featuredAt: { type: Date, default: null },
  tags: [{ type: String, trim: true }],
  badge: { type: String, enum: ['none','featured_in_video','community_pick','new','trending'], default: 'none' },
  changelog: [{ version: String, changes: String, date: { type: Date, default: Date.now } }],
  reviews: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, content: { type: String, maxlength: 1000 }, rating: { type: Number, min: 1, max: 5 }, createdAt: { type: Date, default: Date.now } }]
}, { timestamps: true });
module.exports = mongoose.model('Mod', modSchema);
