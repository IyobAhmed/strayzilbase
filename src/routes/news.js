const express = require('express');
const router = express.Router();
const News = require('../models/News');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category } = req.query;
    const query = { isPublished: true }; if (category) query.category = category;
    const news = await News.find(query).populate('author', 'username avatar').sort({ isPinned: -1, createdAt: -1 }).limit(limit * 1).skip((page - 1) * limit);
    const count = await News.countDocuments(query);
    res.json({ news, totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) { next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const article = await News.findOne({ slug: req.params.slug }).populate('author', 'username avatar');
    if (!article) throw new AppError('Article not found', 404);
    article.views += 1; await article.save();
    res.json({ article });
  } catch (error) { next(error); }
});

router.post('/', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, category, coverImage, tags, scheduledAt } = req.body;
    const article = new News({ title, slug, excerpt, content, category, coverImage, tags, scheduledAt, author: req.user._id });
    await article.save(); await article.populate('author', 'username avatar');
    res.status(201).json({ article });
  } catch (error) { next(error); }
});

router.patch('/:id', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const article = await News.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('author', 'username avatar');
    if (!article) throw new AppError('Article not found', 404);
    res.json({ article });
  } catch (error) { next(error); }
});

router.delete('/:id', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { await News.findByIdAndDelete(req.params.id); res.json({ message: 'Article deleted' }); }
  catch (error) { next(error); }
});

module.exports = router;
