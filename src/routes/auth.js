const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation } = require('../middleware/validation');
const { AppError } = require('../middleware/errorHandler');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

const generateToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const generateVerificationCode = () => crypto.randomInt(100000, 999999).toString();

router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) throw new AppError('Username or email already exists', 409);

    const verificationCode = generateVerificationCode();
    const verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    const user = new User({ 
      username, 
      email, 
      password, 
      verificationCode, 
      verificationCodeExpires,
      role: isFirstUser ? 'owner' : 'user',
      isVerified: isFirstUser ? true : false
    });
    await user.save();

    if (!isFirstUser) {
      try {
        await sendVerificationEmail(email, verificationCode, username);
        console.log(`Verification email sent to ${email}`);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }
    }

    if (isFirstUser) {
      const token = generateToken(user._id);
      console.log('First user registered - automatically promoted to OWNER!');
      return res.status(201).json({
        message: 'Welcome! You are the first user and have been automatically promoted to Owner.',
        token,
        user: user.toPublicJSON()
      });
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification code.',
      userId: user._id,
      verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined
    });
  } catch (error) { next(error); }
});

// NEW: Simple endpoint to make any user an admin (for development only!)
router.post('/make-admin', async (req, res, next) => {
  try {
    const { username, secretKey } = req.body;

    // Simple security - require a secret key (change this in production!)
    if (secretKey !== 'strayzil-admin-2026') {
      throw new AppError('Invalid secret key', 403);
    }

    const user = await User.findOne({ username });
    if (!user) throw new AppError('User not found', 404);

    user.role = 'owner';
    user.isVerified = true;
    await user.save();

    console.log(`User ${username} promoted to OWNER!`);
    res.json({ 
      message: `User ${username} has been promoted to Owner!`,
      user: user.toPublicJSON()
    });
  } catch (error) { next(error); }
});

router.post('/verify', async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('Email already verified', 400);
    if (user.verificationCode !== code) throw new AppError('Invalid verification code', 400);
    if (user.verificationCodeExpires < new Date()) throw new AppError('Verification code expired', 400);

    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    const token = generateToken(user._id);
    res.json({ message: 'Email verified successfully', token, user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

router.post('/resend-verification', async (req, res, next) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    if (user.isVerified) throw new AppError('Already verified', 400);

    const newCode = generateVerificationCode();
    user.verificationCode = newCode;
    user.verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, newCode, user.username);
    } catch (emailError) {
      console.error('Failed to resend verification email:', emailError);
    }

    res.json({ 
      message: 'New verification code sent',
      verificationCode: process.env.NODE_ENV === 'development' ? newCode : undefined
    });
  } catch (error) { next(error); }
});

router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername }] });
    if (!user) throw new AppError('Invalid credentials', 401);

    const isValid = await user.comparePassword(password);
    if (!isValid) throw new AppError('Invalid credentials', 401);
    if (!user.isVerified) throw new AppError('Please verify your email first', 403);
    if (user.isBanned) throw new AppError(`Account banned: ${user.banReason}`, 403);

    user.lastActive = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({ token, user: user.toPublicJSON() });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user.toPublicJSON() });
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ message: 'If email exists, reset instructions sent' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(user.email, resetToken, user.username);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }

    res.json({ message: 'If email exists, reset instructions sent', resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) throw new AppError('Invalid or expired token', 400);

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (error) { next(error); }
});

module.exports = router;
