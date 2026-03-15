const Project = require('../models/Project');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Comment = require('../models/Comment');
const { ApiResponse, ApiError } = require('../utils/apiResponse');
const { encrypt } = require('../utils/encryption');
const sendEmail = require('../services/emailServices');

// create a new project workspace
exports.createProject = async (req, res, next) => {
    try {
        const { title, description, aiApiKey } = req.body;

        const projectData = {
            title,
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'Owner', status: 'Active' }]
        };

        if (aiApiKey) {
            projectData.aiApiKey = encrypt(aiApiKey);
        }

        const project = await Project.create(projectData);

        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: `Created Workspace: "${title}"`
        });

        res.status(201).json(new ApiResponse(project, 'Project created successfully', 201));
    } catch (error) {
        next(error);
    }
};

// get all projects for logged-in user
exports.getProjects = async (req, res, next) => {
    try {
        // Find all projects where the logged-in user is a member
        const projects = await Project.find({ 'members.user': req.user._id })
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            .sort({ updatedAt: -1 });

        res.status(200).json(new ApiResponse(projects, 'Projects retrieved successfully'));
    } catch (error) {
        next(new ApiError(error.message || 'Error fetching projects', 500));
    }
};

// get project by id
exports.getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar')
            .populate({
                path: 'tasks',
                populate: {
                    path: 'assignedTo',
                    select: 'name email avatar'
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

        // --- Track Recently Viewed ---
        const user = await User.findById(req.user._id);
        if (user) {
            user.recentProjects = user.recentProjects?.filter(rp => rp.project?.toString() !== project._id.toString()) || [];
            user.recentProjects.unshift({ project: project._id, viewedAt: new Date() });

            if (user.recentProjects.length > 5) {
                user.recentProjects = user.recentProjects.slice(0, 5);
            }
            await user.save({ validateBeforeSave: false });
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

        project.members.push({
            user: userToInvite._id,
            role: role || 'Contributor',
            status: 'Pending'
        });

        await project.save();

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

exports.acceptInvite = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return next(new ApiError('Project not found', 404));

        const member = project.members.find(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (!member) {
            return next(new ApiError('You are not invited to this project', 403));
        }

        if (member.status === 'Active') {
            return next(new ApiError('You are already an active member', 400));
        }

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

exports.rejectInvite = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return next(new ApiError('Project not found', 404));

        const memberIndex = project.members.findIndex(
            (m) => m.user.toString() === req.user._id.toString()
        );

        if (memberIndex === -1) {
            return next(new ApiError('You are not a member of this project', 400));
        }

        const memberStatus = project.members[memberIndex].status;
        const actionMessage = memberStatus === 'Pending' ? 'Declined invitation' : 'Left the workspace';

        project.members.splice(memberIndex, 1);
        await project.save();

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

        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized. Only the project owner can remove members.', 403));
        }

        if (memberId === project.owner.toString()) {
            return next(new ApiError('Cannot remove the project owner.', 400));
        }

        const memberToRemove = project.members.find(m => m.user.toString() === memberId);
        if (!memberToRemove) {
            return next(new ApiError('Member not found in this project', 404));
        }

        project.members = project.members.filter(m => m.user.toString() !== memberId);
        await project.save();

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

        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized. Only the owner can delete this workspace.', 403));
        }

        await Task.deleteMany({ project: project._id });
        await Activity.deleteMany({ project: project._id });
        await project.deleteOne();

        res.status(200).json(new ApiResponse(null, 'Project and all associated data deleted successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updateProject = async (req, res, next) => {
    try {
        const { title, description, aiApiKey } = req.body;

        const updateFields = {};
        if (title) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (aiApiKey) updateFields.aiApiKey = encrypt(aiApiKey);

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!project) {
            return next(new ApiError('Project not found or unauthorized', 404));
        }

        res.status(200).json(new ApiResponse(project, 'Project updated successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updateIntegrations = async (req, res, next) => {
    try {
        const { geminiApiKey, githubToken, githubRepoPath } = req.body;

        const updateFields = {};
        if (geminiApiKey) updateFields['integrations.geminiApiKey'] = encrypt(geminiApiKey);
        if (githubToken) updateFields['integrations.githubToken'] = encrypt(githubToken);
        if (githubRepoPath !== undefined) updateFields['integrations.githubRepoPath'] = githubRepoPath;

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: 'Updated workspace integration settings'
        });

        res.status(200).json(new ApiResponse(null, 'Integrations securely saved'));
    } catch (error) {
        next(error);
    }
};

exports.updateNotifications = async (req, res, next) => {
    try {
        const { slack, discord, notifyOnSubmit, notifyOnMerge } = req.body;

        const updateFields = {};
        if (slack !== undefined) updateFields['notifications.slack'] = slack;
        if (discord !== undefined) updateFields['notifications.discord'] = discord;
        if (notifyOnSubmit !== undefined) updateFields['notifications.notifyOnSubmit'] = notifyOnSubmit;
        if (notifyOnMerge !== undefined) updateFields['notifications.notifyOnMerge'] = notifyOnMerge;

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!project) {
            return next(new ApiError('Project not found', 404));
        }

        await Activity.create({
            project: project._id,
            user: req.user._id,
            action: 'Updated workspace notification preferences'
        });

        res.status(200).json(new ApiResponse(project.notifications, 'Notification preferences updated'));
    } catch (error) {
        next(error);
    }
};

exports.getRecentProjects = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).populate({
            path: 'recentProjects.project',
            select: 'title description status updatedAt'
        });

        if (!user || !user.recentProjects) {
            return res.status(200).json(new ApiResponse([], 'No recent projects found'));
        }

        const validRecentProjects = user.recentProjects
            .filter(rp => rp.project != null)
            .map(rp => ({
                ...rp.project.toObject(),
                viewedAt: rp.viewedAt
            }));

        res.status(200).json(new ApiResponse(validRecentProjects, 'Recent projects retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.updateProjectWorkflow = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { workflow } = req.body;

        const project = await Project.findById(projectId);
        if (!project) return next(new ApiError('Project not found', 404));

        project.workflow = workflow;
        await project.save();

        res.status(200).json(new ApiResponse(project.workflow, 'Workflow updated successfully'));
    } catch (error) {
        next(error);
    }
};

exports.getProjectAssets = async (req, res, next) => {
    try {
        const { id: projectId } = req.params;

        // 1. Fetch all tasks in the project
        const tasks = await Task.find({ project: projectId })
            .select('_id title attachments createdBy createdAt')
            .populate('createdBy', 'name avatar');

        const taskIds = tasks.map(t => t._id);

        // 2. Fetch all submissions & comments related to those tasks
        const submissions = await Submission.find({ task: { $in: taskIds } })
            .populate('submittedBy', 'name avatar')
            .populate('task', 'title');

        // FIXED: Changed 'author' to 'user' to match the Comment schema
        const comments = await Comment.find({ task: { $in: taskIds } })
            .populate('user', 'name avatar')
            .populate('task', 'title');

        let assets = [];

        // Helper to determine file type from URL or extension
        const getFileType = (url) => {
            if (!url) return 'document';
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)$/)) return 'image';
            if (lowerUrl.match(/\.(mp4|webm|mov)$/)) return 'video';
            if (lowerUrl.match(/\.(pdf)$/)) return 'pdf';
            if (lowerUrl.match(/\.(zip|tar|gz|rar)$/)) return 'archive';
            return 'document';
        };

        // 3. Extract Task Attachments
        tasks.forEach(task => {
            if (task.attachments && Array.isArray(task.attachments)) {
                task.attachments.forEach(att => {
                    const url = typeof att === 'string' ? att : att.url;
                    if (url) {
                        assets.push({
                            _id: Math.random().toString(36).substr(2, 9),
                            name: att.name || url.split('/').pop().split('?')[0] || 'Task File',
                            url: url,
                            type: getFileType(url),
                            source: 'Task Attachment',
                            sourceTitle: task.title,
                            taskId: task._id,
                            uploadedBy: task.createdBy,
                            createdAt: task.createdAt
                        });
                    }
                });
            }
        });

        // 4. Extract Submission Files
        submissions.forEach(sub => {
            const processFile = (url, name) => {
                if (url) {
                    assets.push({
                        _id: Math.random().toString(36).substr(2, 9),
                        name: name || url.split('/').pop().split('?')[0] || 'Submission File',
                        url: url,
                        type: getFileType(url),
                        source: 'Task Submission',
                        sourceTitle: sub.task?.title || 'Unknown Task',
                        taskId: sub.task?._id,
                        uploadedBy: sub.submittedBy,
                        createdAt: sub.createdAt
                    });
                }
            };

            if (sub.files && Array.isArray(sub.files)) {
                sub.files.forEach(f => processFile(typeof f === 'string' ? f : f.url, f.name));
            } else if (sub.fileUrl) {
                processFile(sub.fileUrl, sub.fileName);
            }
        });

        // 5. Extract Comment Attachments
        comments.forEach(comment => {
            if (comment.attachments && Array.isArray(comment.attachments)) {
                comment.attachments.forEach(att => {
                    // Make sure we are reading the correct file properties from the Comment schema
                    const url = att.fileUrl || (typeof att === 'string' ? att : null);
                    const name = att.fileName || (url ? url.split('/').pop().split('?')[0] : 'Comment File');

                    if (url) {
                        assets.push({
                            _id: Math.random().toString(36).substr(2, 9),
                            name: name,
                            url: url,
                            type: getFileType(url),
                            source: 'Comment',
                            sourceTitle: comment.task?.title || 'Task Thread',
                            taskId: comment.task?._id,
                            uploadedBy: comment.user, // FIXED: Changed 'author' to 'user'
                            createdAt: comment.createdAt
                        });
                    }
                });
            }
        });

        // Sort by newest first
        assets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.status(200).json(new ApiResponse(assets, 'Project assets retrieved successfully'));
    } catch (error) {
        next(error);
    }
};