const express = require('express');
const {
    createProject,
    getProjects,
    getProjectById,
    getRecentProjects,
    inviteMember,
    deleteProject,
    updateProject,
    acceptInvite,
    rejectInvite,
    removeMember,
    updateIntegrations,
    updateNotifications,
    updateProjectWorkflow,
    getProjectAssets
} = require('../controllers/projects.controller');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/recent', protect, getRecentProjects);

router.route('/')
    .get(protect, getProjects)
    .post(protect, createProject);

router.route('/:id')
    // Security Fix: Enforce that only recognized, active members can view the project details
    .get(protect, authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getProjectById)

    // Granular Lock: Only Owners and Co-Owners can update project settings
    .put(protect, authorizeRoles('Owner', 'Co-Owner'), updateProject)

    // Ultimate Lock: Only the absolute Owner can delete the project entirely
    .delete(protect, authorizeRoles('Owner'), deleteProject);

// --- Team Management Granular Locks ---

// Only Owners and Co-Owners can invite new people
router.post('/:id/invite', protect, authorizeRoles('Owner', 'Co-Owner'), inviteMember);

// Pending users are not strictly active members yet, so we don't apply authorizeRoles here
router.patch('/:id/accept', protect, acceptInvite);
router.delete('/:id/leave', protect, rejectInvite);

// Update API integrations (Only Owners/Co-Owners)
router.put('/:id/integrations', protect, authorizeRoles('Owner', 'Co-Owner'), updateIntegrations);

// Update Webhook Notifications (Only Owners/Co-Owners)
router.put('/:id/notifications', protect, authorizeRoles('Owner', 'Co-Owner'), updateNotifications);

// Only Owners and Co-Owners can alter the Kanban columns and required fields
router.put('/:id/workflow', protect, authorizeRoles('Owner', 'Co-Owner'), updateProjectWorkflow);

// Only Owners and Co-Owners can kick people out
router.delete('/:id/members/:memberId', protect, authorizeRoles('Owner', 'Co-Owner'), removeMember);

router.get('/:id/assets', protect, authorizeRoles('Owner', 'Co-Owner', 'Contributor', 'Viewer'), getProjectAssets);

module.exports = router;