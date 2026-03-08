const express = require('express');
const {
    submitWork,
    mergeWork,
    getTaskSubmissions
} = require('../controllers/submissions.controller.js');
const { protect } = require('../middleware/authMiddleware.js');
const { isProjectOwner } = require('../middleware/roleMiddleware.js');
const upload = require('../middleware/multerMiddleware.js');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// UPDATED: Changed from '/' to '/submit' to match the frontend api request
router.post('/submit', upload.single('file'), submitWork);

// Get all submissions for a specific task
router.get('/task/:taskId', getTaskSubmissions);

// Final gate: Only owner can merge work
// NOTE: Ensure your isProjectOwner middleware works with this URL parameter
router.post('/:id/merge', isProjectOwner, mergeWork);

module.exports = router;