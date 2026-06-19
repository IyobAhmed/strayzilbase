const express = require('express');
const router = express.Router();
const Wiki = require('../models/Wiki');
const { authenticate, authorize } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/', async (req, res, next) => {
  try {
    const { category } = req.query; const query = {}; if (category) query.category = category;
    const pages = await Wiki.find(query).populate('author', 'username avatar').sort({ order: 1, title: 1 });
    res.json({ pages });
  } catch (error) { next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const page = await Wiki.findOne({ slug: req.params.slug }).populate('author lastEditor', 'username avatar');
    if (!page) throw new AppError('Page not found', 404);
    page.views += 1; await page.save();
    res.json({ page });
  } catch (error) { next(error); }
});

router.post('/', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { const page = new Wiki({ ...req.body, author: req.user._id }); await page.save(); await page.populate('author', 'username avatar'); res.status(201).json({ page }); }
  catch (error) { next(error); }
});

router.patch('/:id', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try {
    const page = await Wiki.findByIdAndUpdate(req.params.id, { ...req.body, lastEditor: req.user._id }, { new: true }).populate('author lastEditor', 'username avatar');
    if (!page) throw new AppError('Page not found', 404); res.json({ page });
  } catch (error) { next(error); }
});

router.delete('/:id', authenticate, authorize('admin', 'owner'), async (req, res, next) => {
  try { await Wiki.findByIdAndDelete(req.params.id); res.json({ message: 'Page deleted' }); }
  catch (error) { next(error); }
});

module.exports = router;
