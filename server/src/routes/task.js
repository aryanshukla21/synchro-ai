const express = require('express');
const { upload } = require('../middleware/multerMiddleware');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const {
    createTask,
    updateTask,
    getProjectTasks,
    updateTaskStatus,
    reviewTaskSubmission,
    getMyTasks,
    requestLeave,
    handleLeaveRequest,
    respondToTaskAssignment,
    getTaskById,
    uploadTaskAttachment // <-- NEW: Imported attachment controller
} = require('../controllers/task.controller');

const router = express.Router();

// Apply authentication middleware to ALL routes in this file
router.use(protect);

// ==========================================
// CORE TASK ROUTES
// ==========================================

// Create a new task (Viewers cannot create tasks)
router.post('/', authorizeRoles('Owner', 'Co-Owner', 'Contributor'), createTask);

// Get all tasks assigned to the logged-in user globally
router.get('/user/me', getMyTasks);

// Get all tasks for a specific project
router.get('/project/:projectId', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getProjectTasks);


// ==========================================
// SINGLE TASK OPERATIONS
// ==========================================

// Get full details of a specific task
router.get('/:id', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getTaskById);

// Update general task details (Title, Description, Priority, etc.)
router.put('/:id', authorizeRoles('Owner', 'Co-Owner', 'Contributor'), updateTask);


// ==========================================
// WORKFLOW & STATUS ROUTES
// ==========================================

// Move task across Kanban columns
router.patch('/:id/status', authorizeRoles('Owner', 'Co-Owner', 'Contributor'), updateTaskStatus);

// Admin Review: Merge or Decline submitted work
router.patch('/:id/review', authorizeRoles('Owner', 'Co-Owner'), reviewTaskSubmission);


// ==========================================
// ASSIGNMENTS & LEAVE REQUESTS
// ==========================================

// Accept or Decline a task assignment (No strict roles as user might be 'Pending')
router.post('/:id/respond', respondToTaskAssignment);

// Request to be unassigned from a task
router.patch('/:id/leave', authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), requestLeave);

// Approve or Reject a leave request
router.patch('/:id/handle-leave', authorizeRoles('Owner', 'Co-Owner'), handleLeaveRequest);


// ==========================================
// FILES & ATTACHMENTS
// ==========================================

// Upload a file attachment to a task (Intercepted by Multer for Cloudinary processing)
router.post('/:id/attachments', upload.single('file'), authorizeRoles('Owner', 'Co-Owner', 'Contributor'), uploadTaskAttachment);

module.exports = router;