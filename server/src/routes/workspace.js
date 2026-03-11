const express = require('express');
const {
    inviteToWorkspace,
    getInviteDetails,
    acceptWorkspaceInvite
} = require('../controllers/workspace.controller');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. Send Invite (Protected: Only Admins/Owners currently logged in can trigger this)
router.post('/invite', protect, inviteToWorkspace);

// 2. Get Invite Details (Public: The user clicking the email link isn't logged in yet)
router.get('/invite-details/:token', getInviteDetails);

// 3. Accept Invite (Protected: The user must be fully logged in/registered to accept)
router.post('/accept-invite', protect, acceptWorkspaceInvite);

module.exports = router;