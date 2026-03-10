const express = require('express');
const {
    submitWork,
    mergeWork,
    getTaskSubmissions
} = require('../controllers/submissions.controller.js');
const { protect } = require('../middleware/authMiddleware.js');
const { authorizeRoles } = require('../middleware/roleMiddleware.js');
const upload = require('../middleware/multerMiddleware.js');

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// --- Granular Permissions Applied ---

// Only Contributors, Co-Owners, and Owners can submit work files (Viewers are blocked)
router.post('/submit', upload.single('file'), authorizeRoles('Owner', 'Co-Owner', 'Contributor'), submitWork);

// Anyone recognized in the project can view the submissions
router.get('/task/:taskId', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getTaskSubmissions);

// Final gate: Only Owners and Co-Owners have the authority to merge and approve work
router.post('/:id/merge', authorizeRoles('Owner', 'Co-Owner'), mergeWork);

module.exports = router;