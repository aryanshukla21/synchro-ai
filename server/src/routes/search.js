const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, searchController.globalSearch);

module.exports = router;