const express = require('express');
const {
    createTask,
    updateTask,               // Added for editing task details
    getProjectTasks,
    updateTaskStatus,
    reviewTaskSubmission,     // Added for Admin Merge/Decline logic
    getMyTasks,
    requestLeave,
    handleLeaveRequest,
    respondToTaskAssignment,
    getTaskById
} = require('../controllers/task.controller.js');
const { protect } = require('../middleware/authMiddleware.js');

// IMPORT THE NEW RBAC MIDDLEWARE
const { authorizeRoles } = require('../middleware/roleMiddleware.js');

const router = express.Router();

// All task routes require authentication
router.use(protect);

// --- General Task Routes ---
// Viewers are excluded from creating tasks
router.post('/', authorizeRoles('Owner', 'Co-Owner', 'Contributor'), createTask);
router.get('/user/me', getMyTasks);     // Get tasks assigned to logged-in user (No project context needed)

// --- Project Specific Routes ---
// Enforce that only recognized, active members can view the project tasks
router.get('/project/:projectId', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getProjectTasks);

// --- Single Task Operations ---
// Anyone in the project can view a task's full details
router.get('/:id', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getTaskById);
// Viewers cannot update task details
router.put('/:id', authorizeRoles('Owner', 'Co-Owner', 'Contributor'), updateTask);

// --- Workflow & Status Routes ---
// Viewers cannot move cards on the Kanban board
router.patch('/:id/status', authorizeRoles('Owner', 'Co-Owner', 'Contributor'), updateTaskStatus);
// Admin Review: Only Owners and Co-Owners can Merge or Decline work
router.patch('/:id/review', authorizeRoles('Owner', 'Co-Owner'), reviewTaskSubmission);

// --- Assignment & Leave Routes ---
// A user accepting/declining an assignment might be "Pending", so we don't apply strict roles here
router.post('/:id/respond', respondToTaskAssignment);

// Any active member assigned to a task can request to leave it
router.patch('/:id/leave', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), requestLeave);
// Only administrators can approve or reject a leave request
router.patch('/:id/handle-leave', authorizeRoles('Owner', 'Co-Owner'), handleLeaveRequest);

module.exports = router;