const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const { ApiResponse, ApiError } = require('../utils/apiResponse');
const { encrypt } = require('../utils/encryption');
const sendEmail = require('../services/emailServices');

// create a new project workspace
exports.createProject = async (req, res, next) => {
    try {
        const { title, description, aiApiKey } = req.body;

        // create project data with owner
        const projectData = {
            title,
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'Owner', status: 'Active' }]
        };

        // encrypt api key
        if (aiApiKey) {
            const encryptedKey = encrypt(aiApiKey);
            projectData.aiApiKey = encryptedKey;
        }

        // create project
        const project = await Project.create(projectData);

        // log initial activity
        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: `Created Workspace: "${title}"`
        });

        res.status(201).json(new ApiResponse(
            project,
            'Project created successfully',
            201
        ));
    } catch (error) {
        next(error);
    }
};

// get all projects for logged-in user
exports.getProjects = async (req, res, next) => {
    try {
        // Pagination setup
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20; // 20 projects per page
        const skip = (page - 1) * limit;

        // Base query: Owner OR Member
        const query = {
            $or: [
                { owner: req.user._id },
                { members: req.user._id }
            ]
        };

        // Calculate total for pagination metadata
        const total = await Project.countDocuments(query);

        // Fetch limited results
        const projects = await Project.find(query)
            .populate('owner', 'name email avatar')
            .populate('members', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const pagination = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };

        res.status(200).json(new ApiResponse(projects, 'Projects retrieved successfully', 200, pagination));
    } catch (error) {
        next(error);
    }
};

// get project by id
exports.getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            // --- CRITICAL FIX: NESTED POPULATION ---
            .populate({
                path: 'tasks',
                populate: {
                    path: 'assignedTo',
                    select: 'name email avatar' // Fetch these specific fields
                }
            })
            .populate({
                path: 'tasks',
                populate: {
                    path: 'createdBy',
                    select: 'name'
                }
            });

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        res.status(200).json(new ApiResponse(project, 'Project details retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.inviteMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) return next(new ApiError('Project not found', 404));

        // AUTH CHECK: Only Owner or Co-Owners can invite
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isCoOwner = project.members.some(m =>
            m.user.toString() === req.user._id.toString() &&
            m.role === 'Co-Owner' &&
            m.status === 'Active'
        );

        if (!isOwner && !isCoOwner) {
            return next(new ApiError('Unauthorized: Only Owners or Co-Owners can invite members', 403));
        }

        const userToInvite = await User.findOne({ email });
        if (!userToInvite) return next(new ApiError('User not registered on Synchro-AI', 404));

        const isAlreadyMember = project.members.some(m => m.user.toString() === userToInvite._id.toString());
        if (isAlreadyMember) return next(new ApiError('User is already in this project', 400));

        // Add to project members
        project.members.push({
            user: userToInvite._id,
            role: role || 'Contributor',
            status: 'Pending'
        });

        await project.save();



        // EMAIL SERVICE TRIGGER
        try {
            await sendEmail({
                email: userToInvite.email,
                subject: `Invitation to collaborate on ${project.title}`,
                message: `Hi ${userToInvite.name},\n\nYou have been invited to join "${project.title}" as a ${role}.\n\nLog in to your dashboard to accept the invitation.`
            });
        } catch (emailErr) {
            console.warn("Email could not be sent, but user was invited in DB", emailErr);
        }

        const updatedProject = await Project.findById(project._id)
            .populate('owner', 'name email')
            .populate('members.user', 'name email');

        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: `Invited ${userToInvite.name} as ${role}`
        });

        res.status(200).json(new ApiResponse(updatedProject, 'Invitation sent successfully'));

    } catch (error) {
        next(error);
    }
};

// Accept Invitation
exports.acceptInvite = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return next(new ApiError('Project not found', 404));

        // Find the member entry for the logged-in user
        const member = project.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member) {
            return next(new ApiError('You are not invited to this project', 403));
        }

        if (member.status === 'Active') {
            return next(new ApiError('You are already an active member', 400));
        }

        // Update Status
        member.status = 'Active';
        await project.save();

        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: `Joined the workspace`
        });

        res.status(200).json(new ApiResponse(project, 'Invitation accepted successfully'));
    } catch (error) {
        next(error);
    }
};

// Reject Invitation or Leave Project
exports.rejectInvite = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return next(new ApiError('Project not found', 404));

        // 1. Find the member first to check their status
        const memberIndex = project.members.findIndex(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (memberIndex === -1) {
            return next(new ApiError('You are not a member of this project', 400));
        }

        // 2. Determine the action message (Declined vs Left)
        const memberStatus = project.members[memberIndex].status;
        const actionMessage = memberStatus === 'Pending'
            ? 'Declined invitation'
            : 'Left the workspace';

        // 3. Remove the member
        project.members.splice(memberIndex, 1);
        await project.save();

        // 4. Log the Activity
        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: actionMessage
        });

        res.status(200).json(new ApiResponse(null, 'Action completed successfully'));
    } catch (error) {
        next(error);
    }
};

exports.removeMember = async (req, res, next) => {
    try {
        const { projectId, memberId } = req.params;

        const project = await Project.findById(projectId);
        if (!project) return next(new ApiError('Project not found', 404));

        // 1. Security Check: Only Owner can perform this action
        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized. Only the project owner can remove members.', 403));
        }

        // 2. Cannot remove yourself (owner)
        if (memberId === project.owner.toString()) {
            return next(new ApiError('Cannot remove the project owner.', 400));
        }

        // 3. Find and remove the member
        const memberToRemove = project.members.find(m => m.user.toString() === memberId);
        if (!memberToRemove) {
            return next(new ApiError('Member not found in this project', 404));
        }

        // Filter them out
        project.members = project.members.filter(m => m.user.toString() !== memberId);
        await project.save();

        // 4. Log Activity
        // Fetch user details just for the log name
        const removedUserDoc = await User.findById(memberId);
        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: `Removed ${removedUserDoc ? removedUserDoc.name : 'a member'} from the team`
        });

        res.status(200).json(new ApiResponse(project.members, 'Member removed successfully'));
    } catch (error) {
        next(error);
    }
};

exports.deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        // 1. Security Check: Only Owner can delete
        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized. Only the owner can delete this workspace.', 403));
        }

        // 2. Cascade Delete: Remove all tasks and activities related to this project
        await Task.deleteMany({ project: project._id });
        await Activity.deleteMany({ project: project._id });

        // 3. Delete the Project itself
        await project.deleteOne();

        res.status(200).json(new ApiResponse(null, 'Project and all associated data deleted successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updateProject = async (req, res, next) => {
    try {
        const { name, aiApiKey } = req.body;
        const project = await Project.findById(req.params.id);

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        if (project.owner.toString() !== req.user.id) {
            return next(new ApiError('Not authorized to update this project', 401));
        }

        if (name) project.name = name;
        if (aiApiKey) {
            // Re-encrypt the new key
            project.aiApiKey = encrypt(aiApiKey);
        }

        await project.save();

        res.status(200).json(new ApiResponse(project, 'Project updated successfully'));
    } catch (error) {
        next(error);
    }
};