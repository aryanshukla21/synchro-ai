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

        // create project data with owner
        const projectData = {
            title,
            description,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'Owner', status: 'Active' }]
        };

        // encrypt api key
        if (aiApiKey) {
            projectData.aiApiKey = encrypt(aiApiKey);
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
exports.getProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        if (!project) {
            throw new ApiError(404, 'Project not found');
        }

        // --- NEW: Track Recently Viewed ---
        const user = await User.findById(req.user._id);
        if (user) {
            // Remove the project if it's already in the list to prevent duplicates
            user.recentProjects = user.recentProjects?.filter(rp => rp.project?.toString() !== project._id.toString()) || [];

            // Push it to the top of the history
            user.recentProjects.unshift({ project: project._id, viewedAt: new Date() });

            // Keep only the 5 most recent
            if (user.recentProjects.length > 5) {
                user.recentProjects = user.recentProjects.slice(0, 5);
            }

            await user.save({ validateBeforeSave: false }); // Skip validation for untouched fields
        }
        // ----------------------------------

        res.status(200).json(new ApiResponse(project, 'Project retrieved successfully'));
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
            // --- NESTED POPULATION ---
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
        const { title, description, aiApiKey } = req.body;

        // Prepare strict update object
        const updateFields = {};
        if (title) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;
        if (aiApiKey) updateFields.aiApiKey = encrypt(aiApiKey);

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, owner: req.user._id }, // Inline security check
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

        // Prepare strict update object
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

        // Prepare strict update object
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

        // Filter out any projects that might have been deleted by the owner
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

        // Verify user is owner or admin (add your role check logic here)
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json(new ApiResponse(null, 'Project not found', 404));

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
            .select('_id title attachments creator createdAt')
            .populate('creator', 'name avatar');

        const taskIds = tasks.map(t => t._id);

        // 2. Fetch all submissions & comments related to those tasks
        const submissions = await Submission.find({ task: { $in: taskIds } })
            .populate('submittedBy', 'name avatar')
            .populate('task', 'title');

        const comments = await Comment.find({ task: { $in: taskIds } })
            .populate('author', 'name avatar')
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
                            uploadedBy: task.creator,
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
                    const url = typeof att === 'string' ? att : att.url;
                    if (url) {
                        assets.push({
                            _id: Math.random().toString(36).substr(2, 9),
                            name: att.name || url.split('/').pop().split('?')[0] || 'Comment File',
                            url: url,
                            type: getFileType(url),
                            source: 'Comment',
                            sourceTitle: comment.task?.title || 'Task Thread',
                            taskId: comment.task?._id,
                            uploadedBy: comment.author,
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