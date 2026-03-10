const express = require('express');
const { addComment, getTaskComments, deleteComment } = require('../controllers/comments.controller.js');
const { protect } = require('../middleware/authMiddleware.js');

// IMPORT THE NEW RBAC MIDDLEWARE
const { authorizeRoles } = require('../middleware/roleMiddleware.js');

const router = express.Router();

// All comment routes require authentication
router.use(protect);

// Anyone in the project can add and read comments
router.post('/', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), addComment);
router.get('/task/:taskId', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getTaskComments);

// Only Owners and Co-Owners can delete comments for moderation purposes
router.delete('/:id', authorizeRoles('Owner', 'Co-Owner'), deleteComment);

module.exports = router;