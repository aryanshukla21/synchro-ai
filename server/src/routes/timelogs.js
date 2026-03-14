const express = require('express');
const router = express.Router();
const { logTime, getUserTimeLogs, getProjectTimeLogs, updateLogStatus } = require('../controllers/timelog.controller');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, logTime);
router.get('/me', protect, getUserTimeLogs);

// Only managers can see everyone's logs and approve/reject them
router.get('/project/:projectId', protect, authorizeRoles('Owner', 'Co-Owner'), getProjectTimeLogs);
router.patch('/:id/status', protect, authorizeRoles('Owner', 'Co-Owner'), updateLogStatus);

module.exports = router;