const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
router.post('/image', authenticate, async (req, res) => {
  res.json({ url: `https://api.dicebear.com/7.x/initials/svg?seed=${Date.now()}`, message: 'Upload endpoint - configure with your storage provider in production' });
});
module.exports = router;
