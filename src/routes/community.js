const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, sort = '-createdAt', search } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }];
    const posts = await Post.find(query).populate('author', 'username avatar role rank').sort(sort).limit(limit * 1).skip((page - 1) * limit);
    const count = await Post.countDocuments(query);
    res.json({ posts, totalPages: Math.ceil(count / limit), currentPage: page, total: count });
  } catch (error) { next(error); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username avatar role rank').populate('comments.author', 'username avatar role rank').populate('comments.replies.author', 'username avatar role rank').populate('likes', 'username');
    if (!post) throw new AppError('Post not found', 404);
    post.views += 1; await post.save();
    res.json({ post });
  } catch (error) { next(error); }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { title, content, type, category, tags, images } = req.body;
    const post = new Post({ title, content, type, category, tags, images, author: req.user._id });
    await post.save(); await post.populate('author', 'username avatar role rank');
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.postsCount': 1 } });
    res.status(201).json({ post });
  } catch (error) { next(error); }
});

router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    const likeIndex = post.likes.indexOf(req.user._id);
    if (likeIndex > -1) post.likes.splice(likeIndex, 1); else post.likes.push(req.user._id);
    await post.save();
    res.json({ likes: post.likes.length, liked: likeIndex === -1 });
  } catch (error) { next(error); }
});

router.post('/:id/comments', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    if (post.isLocked) throw new AppError('Post is locked', 403);
    post.comments.push({ author: req.user._id, content });
    await post.save(); await post.populate('comments.author', 'username avatar role rank');
    await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.commentsCount': 1 } });
    res.json({ post });
  } catch (error) { next(error); }
});

router.post('/:postId/comments/:commentId/replies', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) throw new AppError('Post not found', 404);
    const comment = post.comments.id(req.params.commentId);
    if (!comment) throw new AppError('Comment not found', 404);
    comment.replies.push({ author: req.user._id, content });
    await post.save(); await post.populate('comments.replies.author', 'username avatar role rank');
    res.json({ post });
  } catch (error) { next(error); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new AppError('Post not found', 404);
    const canDelete = post.author.toString() === req.user._id.toString() || ['moderator', 'admin', 'owner'].includes(req.user.role);
    if (!canDelete) throw new AppError('Not authorized', 403);
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
