const mongoose = require('mongoose');
const wikiSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  subcategory: { type: String, default: '' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastEditor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isFeatured: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Wiki', default: null }
}, { timestamps: true });
module.exports = mongoose.model('Wiki', wikiSchema);
