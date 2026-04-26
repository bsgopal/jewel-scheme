const express = require('express');
const router = express.Router();
const { getHomeContent } = require('../controllers/homeController');
const { optionalAuth } = require('../middleware/auth');

router.get('/content', optionalAuth, getHomeContent);

module.exports = router;
