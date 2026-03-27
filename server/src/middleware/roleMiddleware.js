const Project = require('../models/Project');
const Task = require('../models/Task');
const Submission = require('../models/Submission');
const Comment = require('../models/Comment');
const TimeLog = require('../models/TimeLog');
const { ApiError } = require('../utils/apiResponse');

exports.authorizeRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            let projectId;

            // --- 1. DYNAMIC CONTEXT RESOLUTION (Aggressive Scanning) ---

            // Check Explicit Project IDs first
            projectId = req.params?.projectId || req.body?.projectId || req.body?.project || req.query?.projectId;

            // If no explicit Project ID, hunt for Task IDs to derive the Project ID
            if (!projectId) {
                const taskId = req.params?.taskId || req.body?.taskId || req.query?.taskId;
                if (taskId) {
                    const task = await Task.findById(taskId);
                    if (!task) return next(new ApiError(`Task not found (ID: ${taskId})`, 404));
                    projectId = task.project;
                }
            }

            // If STILL no Project ID, deduce it from generic /:id route structures
            if (!projectId && req.params?.id) {
                const genericId = req.params.id;

                if (req.baseUrl.includes('/projects')) {
                    projectId = genericId;
                } else if (req.baseUrl.includes('/task')) {
                    // Prevent catching strings like 'user' or 'me' as ObjectIds
                    if (genericId.length === 24) {
                        const task = await Task.findById(genericId);
                        if (task) projectId = task.project;
                    }
                } else if (req.baseUrl.includes('/submissions')) {
                    if (genericId.length === 24) {
                        const submission = await Submission.findById(genericId).populate('task');
                        if (submission?.task) projectId = submission.task.project;
                    }
                } else if (req.baseUrl.includes('/comments')) {
                    if (genericId.length === 24) {
                        const comment = await Comment.findById(genericId).populate('task');
                        if (comment?.task) projectId = comment.task.project;
                    }
                } else if (req.baseUrl.includes('/timelogs')) { // 🔥 NEW: ADDED TIMELOG SUPPORT
                    if (genericId.length === 24) {
                        const timeLog = await TimeLog.findById(genericId);
                        if (timeLog?.project) projectId = timeLog.project;
                    }
                }
            }

            // --- 2. THE GATEKEEPER CHECK ---
            if (!projectId) {
                console.error(`[RoleAuth Error] Missing Context. Route: ${req.method} ${req.originalUrl}, Body:`, req.body);
                return next(new ApiError('Project context is required to verify permissions. (Ensure IDs are passed before files in FormData)', 400));
            }

            // --- 3. PROJECT VALIDATION ---
            const project = await Project.findById(projectId);
            if (!project) return next(new ApiError('Project not found', 404));

            // --- 4. DETERMINE USER'S ROLE ---
            let userRole = null;
            if (project.owner.toString() === req.user._id.toString()) {
                userRole = 'Owner';
            } else {
                const member = project.members.find(
                    (m) => m.user.toString() === req.user._id.toString()
                );
                if (member) userRole = member.role;
            }

            // --- 5. ENFORCE PERMISSIONS ---
            if (!userRole) {
                return next(new ApiError('You do not have access to this project', 403));
            }

            if (!allowedRoles.includes(userRole)) {
                return next(new ApiError(`Access Denied: As a '${userRole}', you do not have permission to perform this action. Required: ${allowedRoles.join(' or ')}`, 403));
            }

            // --- 6. ATTACH CONTEXT & PROCEED ---
            req.project = project;
            req.userRole = userRole;

            next();
        } catch (error) {
            console.error('[RoleMiddleware Exception]:', error.message);
            next(error);
        }
    };
};