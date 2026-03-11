const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const sendEmail = require('../services/emailServices');
const { ApiResponse, ApiError } = require('../utils/apiResponse');

// 1. Generate token and send email
exports.inviteToWorkspace = async (req, res, next) => {
    try {
        const { email, role, workspaceId } = req.body;

        // Find the primary workspace owned by the user
        const workspace = await Project.findOne({ _id: workspaceId, owner: req.user._id });
        if (!workspace) {
            return next(new ApiError('No workspace found where you are the owner.', 404));
        }

        // Check if user is already a member
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const isMember = workspace.members.some(m => m.user.toString() === existingUser._id.toString());
            if (isMember) {
                return next(new ApiError('User is already a member of this workspace', 400));
            }
        }

        // Generate secure 32-byte token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Expires in 7 days

        // Save invitation to database
        await Invitation.create({
            token,
            email,
            role,
            workspace: workspace._id,
            invitedBy: req.user._id,
            expiresAt
        });

        // Send Email
        const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/join-workspace/${token}`;
        const message = `You have been invited to join the workspace "${workspace.title || workspace.name}" as a ${role}.\n\nClick the link below to accept the invitation and join your team:\n\n${inviteUrl}\n\nThis link will expire in 7 days.`;

        await sendEmail({
            email,
            subject: `Invitation to join ${workspace.title || workspace.name}`,
            message
        });

        res.status(200).json(new ApiResponse(null, `Invitation sent securely to ${email}`));
    } catch (error) {
        next(error);
    }
};

// 2. Fetch details for the public JoinWorkspace page
exports.getInviteDetails = async (req, res, next) => {
    try {
        const { token } = req.params;
        const invitation = await Invitation.findOne({ token }).populate('workspace', 'title name');

        if (!invitation) {
            return next(new ApiError('Invalid or expired invitation token', 404));
        }

        res.status(200).json(new ApiResponse({
            email: invitation.email,
            role: invitation.role,
            workspaceName: invitation.workspace.title || invitation.workspace.name,
            workspaceId: invitation.workspace._id
        }, 'Invitation details retrieved'));
    } catch (error) {
        next(error);
    }
};

// 3. Consume token and add user to workspace
exports.acceptWorkspaceInvite = async (req, res, next) => {
    try {
        const { token } = req.body;

        const invitation = await Invitation.findOne({ token }).populate('workspace');
        if (!invitation) {
            return next(new ApiError('Invalid or expired invitation token', 404));
        }

        const workspace = invitation.workspace;

        // Check if user is already in the workspace array (e.g., from a previous manual project invite)
        const existingMember = workspace.members.find(m => m.user.toString() === req.user._id.toString());

        if (existingMember) {
            existingMember.status = 'Active';
            existingMember.role = invitation.role;
        } else {
            workspace.members.push({
                user: req.user._id,
                role: invitation.role,
                status: 'Active'
            });
        }

        await workspace.save();

        // Log the activity
        await Activity.create({
            project: workspace._id,
            user: req.user._id,
            action: `Joined the workspace via email invitation`
        });

        // Destroy the token so it cannot be reused
        await Invitation.deleteOne({ _id: invitation._id });

        res.status(200).json(new ApiResponse(workspace, 'Successfully joined the workspace'));
    } catch (error) {
        next(error);
    }
};