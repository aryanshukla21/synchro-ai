const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Comment = require('../models/Comment');
const { ApiError } = require('../utils/apiResponse');

exports.authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            let projectId;

            // 1. DYNAMIC CONTEXT RESOLUTION
            // Automatically find the associated project ID no matter what route is being accessed
            if (req.params.projectId) {
                projectId = req.params.projectId;
            } else if (req.body.project) {
                projectId = req.body.project;
            } else if (req.body.projectId) {
                projectId = req.body.projectId;
            } else if (req.params.taskId || req.body.taskId) {
                // If a Task ID is provided directly
                const taskId = req.params.taskId || req.body.taskId;
                const task = await Task.findById(taskId);
                if (!task) return next(new ApiError('Task not found', 404));
                projectId = task.project;
            } else if (req.baseUrl.includes('/projects') && req.params.id) {
                projectId = req.params.id;
            } else if (req.baseUrl.includes('/task') && req.params.id) {
                const task = await Task.findById(req.params.id);
                if (!task) return next(new ApiError('Task not found', 404));
                projectId = task.project;
            } else if (req.baseUrl.includes('/submissions') && req.params.id) {
                // Trace Submission -> Task -> Project
                const submission = await Submission.findById(req.params.id).populate('task');
                if (!submission || !submission.task) return next(new ApiError('Submission not found', 404));
                projectId = submission.task.project;
            } else if (req.baseUrl.includes('/comments') && req.params.id) {
                // Trace Comment -> Task -> Project
                const comment = await Comment.findById(req.params.id).populate('task');
                if (!comment || !comment.task) return next(new ApiError('Comment not found', 404));
                projectId = comment.task.project;
            }

            if (!projectId) {
                return next(new ApiError('Project context is required to verify permissions', 400));
            }

            // 2. Find the Project
            const project = await Project.findById(projectId);
            if (!project) return next(new ApiError('Project not found', 404));

            // 3. Determine User's Role in this specific Project
            let userRole = null;
            if (project.owner.toString() === req.user._id.toString()) {
                userRole = 'Owner'; // The creator of the project is always the Owner
            } else {
                const member = project.members.find(
                    (m) => m.user.toString() === req.user._id.toString()
                );
                if (member) userRole = member.role; // e.g., 'Co-Owner', 'Contributor', 'Viewer'
            }

            // 4. Validate Access against allowed roles passed into the middleware
            if (!userRole) {
                return next(new ApiError('You do not have access to this project', 403));
            }

            if (!allowedRoles.includes(userRole)) {
                return next(new ApiError(`Access Denied: As a '${userRole}', you do not have permission to perform this action. Required: ${allowedRoles.join(' or ')}`, 403));
            }

            // 5. Attach data for downstream controllers to prevent duplicate DB queries
            req.project = project;
            req.userRole = userRole;

            next();
        } catch (error) {
            next(error);
        }
    };
};