const express = require('express');
const {
    createProject,
    getProjects,
    getProjectById,
    inviteMember,
    deleteProject,
    updateProject,
    acceptInvite,
    rejectInvite,
    removeMember
} = require('../controllers/projects.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getProjects)
    .post(protect, createProject);

router.route('/:id')
    .get(protect, getProjectById)
    .put(protect, updateProject)
    .delete(protect, deleteProject);

router.post('/:id/invite', protect, inviteMember);
router.patch('/:id/accept', protect, acceptInvite);
router.delete('/:id/leave', protect, rejectInvite);
router.delete('/:id/members/:memberId', protect, removeMember);

module.exports = router;