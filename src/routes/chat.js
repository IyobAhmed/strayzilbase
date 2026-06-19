const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/:channel', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await ChatMessage.find({ channel: req.params.channel, isDeleted: false, isPrivate: false }).populate('sender', 'username avatar role rank').sort({ createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    res.json({ messages: messages.reverse() });
  } catch (error) { next(error); }
});

router.get('/private/:userId', authenticate, async (req, res, next) => {
  try {
    const messages = await ChatMessage.find({ isPrivate: true, $or: [{ sender: req.user._id, recipient: req.params.userId }, { sender: req.params.userId, recipient: req.user._id }], isDeleted: false }).populate('sender', 'username avatar').sort({ createdAt: 1 });
    res.json({ messages });
  } catch (error) { next(error); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { channel, content, recipient, isPrivate } = req.body;
    const user = await User.findById(req.user._id);
    if (user.isMuted && user.mutedUntil > new Date()) throw new AppError('You are muted', 403);
    const message = new ChatMessage({ channel: channel || 'global', content, sender: req.user._id, recipient, isPrivate: isPrivate || false });
    await message.save(); await message.populate('sender', 'username avatar role rank');
    res.status(201).json({ message });
  } catch (error) { next(error); }
});

router.delete('/:id', authenticate, authorize('moderator', 'admin', 'owner'), async (req, res, next) => {
  try {
    const message = await ChatMessage.findByIdAndUpdate(req.params.id, { isDeleted: true, deletedBy: req.user._id, deletedAt: new Date() }, { new: true });
    if (!message) throw new AppError('Message not found', 404); res.json({ message: 'Message deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
