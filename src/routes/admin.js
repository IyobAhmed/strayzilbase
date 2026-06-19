const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Mod = require('../models/Mod');
const Post = require('../models/Post');
const News = require('../models/News');
const Wiki = require('../models/Wiki');
const Report = require('../models/Report');
const Announcement = require('../models/Announcement');
const Supporter = require('../models/Supporter');
const ModerationLog = require('../models/ModerationLog');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/dashboard', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const stats = {
      users: await User.countDocuments(), activeUsers: await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
      posts: await Post.countDocuments(), pendingMods: await Mod.countDocuments({ status: 'pending' }),
      reports: await Report.countDocuments({ status: 'pending' }), newsArticles: await News.countDocuments(),
      wikiPages: await Wiki.countDocuments(), totalMods: await Mod.countDocuments(), bannedUsers: await User.countDocuments({ isBanned: true })
    };
    res.json({ stats });
  } catch (error) { next(error); }
});

router.get('/mods/pending', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { const mods = await Mod.find({ status: 'pending' }).populate('author', 'username avatar').sort({ createdAt: -1 }); res.json({ mods }); }
  catch (error) { next(error); }
});

router.get('/reports', authenticate, authorize('moderator', 'admin', 'owner'), async (req, res, next) => {
  try { const { status = 'pending' } = req.query; const reports = await Report.find({ status }).populate('reporter', 'username avatar').populate('targetUser', 'username avatar').sort({ createdAt: -1 }); res.json({ reports }); }
  catch (error) { next(error); }
});

router.patch('/reports/:id', authenticate, authorize('moderator', 'admin', 'owner'), async (req, res, next) => {
  try { const { status, resolution, resolutionNote } = req.body; const report = await Report.findByIdAndUpdate(req.params.id, { status, resolution, resolutionNote, resolvedBy: req.user._id }, { new: true }).populate('reporter targetUser', 'username avatar'); if (!report) throw new AppError('Report not found', 404); res.json({ report }); }
  catch (error) { next(error); }
});

router.get('/logs', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { const logs = await ModerationLog.find().populate('moderator targetUser', 'username avatar').sort({ createdAt: -1 }).limit(100); res.json({ logs }); }
  catch (error) { next(error); }
});

router.post('/logs', authenticate, authorize('moderator', 'admin', 'owner'), async (req, res, next) => {
  try { const log = new ModerationLog({ ...req.body, moderator: req.user._id }); await log.save(); res.status(201).json({ log }); }
  catch (error) { next(error); }
});

router.get('/announcements', async (req, res, next) => {
  try { const announcements = await Announcement.find({ isActive: true }).populate('createdBy', 'username avatar').sort({ createdAt: -1 }); res.json({ announcements }); }
  catch (error) { next(error); }
});

router.post('/announcements', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { const announcement = new Announcement({ ...req.body, createdBy: req.user._id }); await announcement.save(); await announcement.populate('createdBy', 'username avatar'); res.status(201).json({ announcement }); }
  catch (error) { next(error); }
});

router.patch('/announcements/:id', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true }); if (!announcement) throw new AppError('Announcement not found', 404); res.json({ announcement }); }
  catch (error) { next(error); }
});

router.delete('/announcements/:id', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { await Announcement.findByIdAndDelete(req.params.id); res.json({ message: 'Announcement deleted' }); }
  catch (error) { next(error); }
});

router.get('/supporters', async (req, res, next) => {
  try { const supporters = await Supporter.find().populate('user', 'username avatar rank joinedAt medals').sort({ displayOrder: 1, createdAt: 1 }); res.json({ supporters }); }
  catch (error) { next(error); }
});

router.post('/supporters', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { const supporter = new Supporter(req.body); await supporter.save(); await supporter.populate('user', 'username avatar rank joinedAt medals'); res.status(201).json({ supporter }); }
  catch (error) { next(error); }
});

router.delete('/supporters/:id', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { await Supporter.findByIdAndDelete(req.params.id); res.json({ message: 'Supporter removed' }); }
  catch (error) { next(error); }
});

module.exports = router;
