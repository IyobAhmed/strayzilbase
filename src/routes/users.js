const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/profile/:username', async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('-password -email');
    if (!user) throw new AppError('User not found', 404);
    res.json({ user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

router.patch('/profile', authenticate, async (req, res, next) => {
  try {
    const allowedUpdates = ['bio', 'location', 'website', 'avatar', 'socialLinks', 'theme', 'notifications'];
    const updates = {};
    Object.keys(req.body).forEach(key => { if (allowedUpdates.includes(key)) updates[key] = req.body[key]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

router.get('/', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await User.countDocuments(query);
    res.json({ users: users.map(u => u.toPublicJSON()), totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) { next(error); }
});

router.patch('/:id/role', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    res.json({ user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

router.patch('/:id/ban', authenticate, authorize('moderator', 'admin', 'owner'), async (req, res, next) => {
  try {
    const { isBanned, reason, bannedUntil } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned, banReason: reason, bannedUntil }, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    res.json({ user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

router.patch('/:id/medals', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const { action, medalType } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) throw new AppError('User not found', 404);
    if (action === 'grant') {
      const exists = user.medals.some(m => m.type === medalType);
      if (exists) throw new AppError('Medal already exists', 400);
      user.medals.push({ type: medalType, awardedBy: req.user._id });
    } else if (action === 'remove') {
      user.medals = user.medals.filter(m => m.type !== medalType);
    }
    await user.save();
    res.json({ user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

router.patch('/:id/rank', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const { rank } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { rank }, { new: true }).select('-password');
    if (!user) throw new AppError('User not found', 404);
    res.json({ user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

module.exports = router;
