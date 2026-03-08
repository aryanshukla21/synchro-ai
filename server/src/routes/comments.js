const express = require('express');
const { addComment, getTaskComments, deleteComment } = require('../controllers/comments.controller.js');
const { protect } = require('../middleware/authMiddleware.js');

const router = express.Router();

// All comment routes require authentication
router.use(protect);

router.post('/', addComment);
router.get('/task/:taskId', getTaskComments);
router.delete('/:id', deleteComment);

module.exports = router;