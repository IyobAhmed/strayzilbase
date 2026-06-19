const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res, next) => {
  try { const notifications = await Notification.find({ recipient: req.user._id }).populate('sender', 'username avatar').sort({ createdAt: -1 }).limit(50); res.json({ notifications }); }
  catch (error) { next(error); }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try { await Notification.findByIdAndUpdate(req.params.id, { isRead: true }); res.json({ message: 'Marked as read' }); }
  catch (error) { next(error); }
});

router.patch('/read-all', authenticate, async (req, res, next) => {
  try { await Notification.updateMany({ recipient: req.user._id }, { isRead: true }); res.json({ message: 'All marked as read' }); }
  catch (error) { next(error); }
});

module.exports = router;
