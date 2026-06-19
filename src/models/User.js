const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const medalSchema = new mongoose.Schema({
  type: { type: String, enum: ['supporter','contributor','builder','creator','moderator','veteran','founding_supporter'], required: true },
  awardedAt: { type: Date, default: Date.now },
  awardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30, match: /^[a-zA-Z0-9_]+$/ },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 8 },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user','moderator','admin','owner'], default: 'user' },
  rank: { type: String, enum: ['Newcomer','Explorer','Builder','Creator','Veteran','Legend'], default: 'Newcomer' },
  medals: [medalSchema],
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String, default: null },
  verificationCodeExpires: { type: Date, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  bio: { type: String, maxlength: 500, default: '' },
  location: { type: String, maxlength: 100, default: '' },
  website: { type: String, maxlength: 200, default: '' },
  joinedAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  bannedUntil: { type: Date, default: null },
  isMuted: { type: Boolean, default: false },
  mutedUntil: { type: Date, default: null },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mod' }],
  stats: { postsCount: { type: Number, default: 0 }, commentsCount: { type: Number, default: 0 }, likesReceived: { type: Number, default: 0 }, modsSubmitted: { type: Number, default: 0 }, downloads: { type: Number, default: 0 } },
  socialLinks: { youtube: { type: String, default: '' }, twitter: { type: String, default: '' }, discord: { type: String, default: '' }, instagram: { type: String, default: '' } },
  theme: { type: String, enum: ['dark','light'], default: 'dark' },
  notifications: { email: { type: Boolean, default: true }, push: { type: Boolean, default: true }, mentions: { type: Boolean, default: true } }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicJSON = function() {
  return { id: this._id, username: this.username, avatar: this.avatar, role: this.role, rank: this.rank, medals: this.medals, bio: this.bio, location: this.location, website: this.website, joinedAt: this.joinedAt, stats: this.stats, socialLinks: this.socialLinks };
};

module.exports = mongoose.model('User', userSchema);
