const express = require('express');
const router = express.Router();
const Mod = require('../models/Mod');
const User = require('../models/User');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, status = 'approved', sort = '-createdAt', search } = req.query;
    const query = { status };
    if (category) query.category = category;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    const mods = await Mod.find(query).populate('author', 'username avatar').sort(sort).limit(limit * 1).skip((page - 1) * limit);
    const count = await Mod.countDocuments(query);
    res.json({ mods, totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) { next(error); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const mod = await Mod.findById(req.params.id).populate('author', 'username avatar');
    if (!mod) throw new AppError('Mod not found', 404);
    mod.views = (mod.views || 0) + 1; await mod.save();
    res.json({ mod });
  } catch (error) { next(error); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, description, shortDescription, category, version, minecraftVersion, tags } = req.body;
    const mod = new Mod({ title, description, shortDescription, category, version, minecraftVersion, tags, author: req.user._id, status: 'pending' });
    await mod.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.modsSubmitted': 1 } });
    res.status(201).json({ mod });
  } catch (error) { next(error); }
});

router.patch('/:id', authenticate, async (req, res, next) => {
  try {
    const mod = await Mod.findById(req.params.id);
    if (!mod) throw new AppError('Mod not found', 404);
    if (mod.author.toString() !== req.user._id.toString() && !['admin', 'owner'].includes(req.user.role)) throw new AppError('Not authorized', 403);
    const allowedUpdates = ['title', 'description', 'shortDescription', 'category', 'version', 'minecraftVersion', 'tags', 'icon', 'images'];
    const updates = {}; Object.keys(req.body).forEach(key => { if (allowedUpdates.includes(key)) updates[key] = req.body[key]; });
    const updatedMod = await Mod.findByIdAndUpdate(req.params.id, updates, { new: true }).populate('author', 'username avatar');
    res.json({ mod: updatedMod });
  } catch (error) { next(error); }
});

router.patch('/:id/status', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const update = { status }; if (rejectionReason) update.rejectionReason = rejectionReason;
    const mod = await Mod.findByIdAndUpdate(req.params.id, update, { new: true }).populate('author', 'username avatar');
    if (!mod) throw new AppError('Mod not found', 404);
    res.json({ mod });
  } catch (error) { next(error); }
});

router.patch('/:id/feature', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const { featured } = req.body;
    const mod = await Mod.findByIdAndUpdate(req.params.id, { featured, featuredAt: featured ? new Date() : null, badge: featured ? 'featured_in_video' : 'none' }, { new: true }).populate('author', 'username avatar');
    if (!mod) throw new AppError('Mod not found', 404);
    res.json({ mod });
  } catch (error) { next(error); }
});

router.post('/:id/rate', authenticate, async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const mod = await Mod.findById(req.params.id);
    if (!mod) throw new AppError('Mod not found', 404);
    const existingRating = mod.ratings.find(r => r.user.toString() === req.user._id.toString());
    if (existingRating) { existingRating.value = rating; if (review) existingRating.review = review; }
    else { mod.ratings.push({ user: req.user._id, value: rating, review }); }
    const total = mod.ratings.reduce((sum, r) => sum + r.value, 0);
    mod.rating = total / mod.ratings.length; mod.ratingCount = mod.ratings.length;
    await mod.save();
    res.json({ mod });
  } catch (error) { next(error); }
});

router.post('/:id/download', async (req, res, next) => {
  try {
    const mod = await Mod.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }, { new: true });
    if (!mod) throw new AppError('Mod not found', 404);
    res.json({ downloads: mod.downloads });
  } catch (error) { next(error); }
});

module.exports = router;
