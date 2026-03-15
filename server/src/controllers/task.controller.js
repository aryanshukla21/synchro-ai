const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const { ApiResponse, ApiError } = require('../utils/apiResponse');
const notificationService = require('../services/notificationServices');
const sendEmail = require('../services/emailServices');
const socketHelper = require('../config/socket');
const { uploadOnCloudinary } = require('../utils/cloudinaryHelper');

// 1. Create Task (Restricted to Project Owner)
exports.createTask = async (req, res, next) => {
    try {
        const {
            title, description, projectId, assignedTo, priority, deadline,
            estimatedHours, type, severity, environment, stepsToReproduce
        } = req.body;

        if (!projectId) return next(new ApiError('Project ID is required', 400));
        if (!title) return next(new ApiError('Task Title is required', 400));

        const project = await Project.findById(projectId);
        if (!project) return next(new ApiError('Project not found', 404));

        if (project.owner.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized. Only the project owner can create tasks.', 403));
        }

        let assignee = null;
        if (assignedTo && assignedTo !== '' && assignedTo !== 'null') {
            assignee = assignedTo;
        }

        const task = await Task.create({
            title,
            description,
            project: projectId,
            createdBy: req.user._id,
            assignedTo: assignee,
            priority: priority || 'Medium',
            deadline,
            status: 'To-Do',
            assignmentStatus: assignee ? 'Pending' : 'Pending',
            leaveRequested: false,
            estimatedHours: estimatedHours || 0,
            type: type || 'Task',
            severity: severity || 'Medium',
            environment: environment || 'Development',
            stepsToReproduce: stepsToReproduce || ''
        });

        await Activity.create({
            project: projectId,
            user: req.user._id,
            action: `Created ${task.type.toLowerCase()}: "${task.title}"`
        });

        // NOTIFICATION TRIGGER: Send to Assigned User
        if (assignee) {
            await notificationService.notifyTaskAssignment(
                assignee,
                req.user._id,
                task.title
            );
        }

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name');

        // Emit real-time creation to the project room
        socketHelper.emitToProjectRoom(projectId, 'taskCreated', populatedTask);

        res.status(201).json(new ApiResponse(populatedTask, 'Task created successfully'));
    } catch (error) {
        next(error);
    }
};

// 2. Generic Update Task
exports.updateTask = async (req, res, next) => {
    try {
        const {
            title, description, priority, deadline, assignedTo, status,
            estimatedHours, type, severity, environment, stepsToReproduce
        } = req.body;

        const task = await Task.findById(req.params.id);
        if (!task) return next(new ApiError('Task not found', 404));

        // Ownership/Role Check (Customize based on your exact permissions)
        if (task.createdBy.toString() !== req.user._id.toString() && task.assignedTo?.toString() !== req.user._id.toString()) {
            // Allow assignee or creator to edit
        }

        let isModified = false;

        // Helper to track changes
        const trackChange = (field, oldVal, newVal) => {
            if (String(oldVal) !== String(newVal) && newVal !== undefined) {
                task.changelog.push({
                    user: req.user._id,
                    field,
                    oldValue: oldVal || 'None',
                    newValue: newVal
                });
                isModified = true;
                return true;
            }
            return false;
        };

        // Check and apply changes
        if (trackChange('Title', task.title, title)) task.title = title;
        if (trackChange('Description', task.description, description)) task.description = description;
        if (trackChange('Priority', task.priority, priority)) task.priority = priority;
        if (trackChange('Status', task.status, status)) task.status = status;
        if (trackChange('Type', task.type, type)) task.type = type;
        if (trackChange('Severity', task.severity, severity)) task.severity = severity;
        if (trackChange('Environment', task.environment, environment)) task.environment = environment;
        if (trackChange('Estimated Hours', task.estimatedHours, estimatedHours)) task.estimatedHours = estimatedHours;
        if (trackChange('Deadline', task.deadline, deadline)) task.deadline = deadline;
        if (trackChange('Steps to Reproduce', task.stepsToReproduce, stepsToReproduce)) task.stepsToReproduce = stepsToReproduce;

        if (assignedTo !== undefined) {
            const newAssigneeId = assignedTo === '' || assignedTo === 'null' ? null : assignedTo;
            if (String(task.assignedTo) !== String(newAssigneeId)) {
                task.changelog.push({
                    user: req.user._id,
                    field: 'Assignee',
                    oldValue: task.assignedTo || 'Unassigned',
                    newValue: newAssigneeId || 'Unassigned'
                });

                task.assignedTo = newAssigneeId;
                task.assignmentStatus = 'Pending';
                isModified = true;

                if (newAssigneeId) {
                    await notificationService.notifyTaskAssignment(newAssigneeId, req.user._id, task.title);
                }
            }
        }

        if (isModified) {
            await task.save();
        }

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name avatar')
            .populate('changelog.user', 'name avatar'); // Populate the changelog user

        // Emit real-time update to the project room
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', populatedTask);

        res.status(200).json(new ApiResponse(populatedTask, 'Task updated successfully'));
    } catch (error) {
        next(error);
    }
};

// 3. Respond to Assignment (Modified to move to To-Do)
exports.respondToTaskAssignment = async (req, res, next) => {
    try {
        const { response } = req.body;
        const action = response.charAt(0).toUpperCase() + response.slice(1).toLowerCase();

        if (!['Accept', 'Decline'].includes(action)) {
            return next(new ApiError('Invalid response.', 400));
        }

        let task = await Task.findById(req.params.id).populate('createdBy', 'name email');
        if (!task) return next(new ApiError('Task not found', 404));

        if (task.assignedTo.toString() !== req.user._id.toString()) {
            return next(new ApiError('Not authorized', 403));
        }

        task.assignmentStatus = action === 'Accept' ? 'Accepted' : 'Declined';

        // 🔥 AUTOMATION: If accepted, move to To-Do status automatically
        if (action === 'Accept') {
            task.status = 'To-Do';
        }

        await task.save();

        // NOTIFICATIONS & ACTIVITY (Existing logic stays same)
        await notificationService.notifyTaskResponse(task.createdBy._id, req.user._id, task.title, action);
        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `${action}ed task assignment: "${task.title}"`
        });

        const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name avatar').populate('createdBy', 'name');
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', populatedTask);

        res.status(200).json(new ApiResponse(populatedTask, `Task assignment ${action}ed`));
    } catch (error) {
        next(error);
    }
};

// 4. Update Task Status (Strict automation logic)
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        let task = await Task.findById(req.params.id);
        if (!task) return next(new ApiError('Task not found', 404));

        // SECURITY: If not owner, prevent manual status jumps to "Merged"
        const isOwner = task.createdBy.toString() === req.user._id.toString();
        if (!isOwner && status === 'Merged') {
            return next(new ApiError('Only project owner can merge tasks', 403));
        }

        const oldStatus = task.status;
        task.status = status;
        await task.save();

        // NOTIFICATION: Notify Owner if work started
        if (oldStatus === 'To-Do' && status === 'In-Progress') {
            await notificationService.notify({
                recipient: task.createdBy,
                sender: req.user._id,
                message: `${req.user.name} started working on task: "${task.title}"`,
                type: 'Task'
            });
        }

        const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email avatar').populate('createdBy', 'name');

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `Moved "${task.title}" to ${status}`
        });

        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', populatedTask);
        res.status(200).json(new ApiResponse(populatedTask, `Task status updated to ${status}`));
    } catch (error) {
        next(error);
    }
};

// 5. Admin Review Submission (Merge or Decline) -> Notify Assignee + Email
exports.reviewTaskSubmission = async (req, res, next) => {
    try {
        const { action } = req.body;
        let task = await Task.findById(req.params.id).populate('assignedTo', 'name email');

        if (!task) return next(new ApiError('Task not found', 404));

        if (task.createdBy.toString() !== req.user._id.toString()) {
            return next(new ApiError('Only task owner can review submissions', 403));
        }

        if (action === 'Merge') {
            task.status = 'Merged';
            await notificationService.notifyMerge(task.assignedTo._id, req.user._id, task.title);
        } else if (action === 'Decline') {
            task.status = 'In-Progress';
            await notificationService.notify({
                recipient: task.assignedTo._id,
                sender: req.user._id,
                message: `Your submission for "${task.title}" was declined. Please revise and re-submit.`,
                type: 'Task'
            });
        } else {
            return next(new ApiError('Invalid action. Use "Merge" or "Decline".', 400));
        }

        await task.save();

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `${action === 'Merge' ? 'Approved & Merged' : 'Declined'} task: "${task.title}"`
        });

        await sendEmail({
            email: task.assignedTo.email,
            subject: `Update on Task: ${task.title}`,
            message: `The project owner has ${action.toLowerCase()}d your submission for "${task.title}". Status is now: ${task.status}.`
        });

        task = await Task.findById(task._id).populate('assignedTo', 'name email avatar').populate('createdBy', 'name');

        // Emit real-time update
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', task);

        res.status(200).json(new ApiResponse(task, `Submission ${action}d successfully`));
    } catch (error) {
        next(error);
    }
};

// --- READ OPERATIONS ---

exports.getTaskById = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('project', 'title description')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name');

        if (!task) return next(new ApiError('Task not found', 404));

        res.status(200).json(new ApiResponse(task, 'Task retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

// --- READ OPERATIONS WITH PAGINATION ---

exports.getProjectTasks = async (req, res, next) => {
    try {
        // Pagination logic (Defaults to page 1, 50 items per page)
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const query = { project: req.params.projectId };

        // Count total documents for frontend math
        const total = await Task.countDocuments(query);

        // Fetch paginated documents
        const tasks = await Task.find(query)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const pagination = {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };

        // Notice we pass pagination as the 4th argument
        res.status(200).json(new ApiResponse(tasks, 'Project tasks retrieved successfully', 200, pagination));
    } catch (error) {
        next(error);
    }
};

exports.getMyTasks = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 50;
        const skip = (page - 1) * limit;

        const query = {
            assignedTo: req.user._id,
            assignmentStatus: { $ne: 'Declined' }
        };

        const total = await Task.countDocuments(query);

        const tasks = await Task.find(query)
            .populate('project', 'title description')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name')
            .sort({ deadline: 1 })
            .skip(skip)
            .limit(limit);

        const pagination = { total, page, limit, totalPages: Math.ceil(total / limit) };

        res.status(200).json(new ApiResponse(tasks, 'User tasks fetched successfully', 200, pagination));
    } catch (error) {
        next(error);
    }
};

// --- LEAVE REQUEST LOGIC ---

exports.requestLeave = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return next(new ApiError('Task not found', 404));

        if (task.assignedTo.toString() !== req.user._id.toString()) {
            return next(new ApiError('You are not assigned to this task', 403));
        }

        task.leaveRequested = true;
        await task.save();

        res.status(200).json(new ApiResponse(task, 'Leave request sent to owner'));
    } catch (error) {
        next(error);
    }
};

exports.handleLeaveRequest = async (req, res, next) => {
    try {
        const { action } = req.body;
        let task = await Task.findById(req.params.id);

        if (!task) return next(new ApiError('Task not found', 404));
        if (task.createdBy.toString() !== req.user._id.toString()) {
            return next(new ApiError('Only task owner can handle leave requests', 403));
        }

        if (!task.leaveRequested) {
            return next(new ApiError('No leave request exists for this task', 400));
        }

        if (action === 'Approve') {
            task.assignedTo = null;
            task.assignmentStatus = 'Pending';
            task.leaveRequested = false;
        } else if (action === 'Reject') {
            task.leaveRequested = false;
        }

        await task.save();

        task = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name');

        // Emit real-time update so the task un-assigns visually
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', task);

        res.status(200).json(new ApiResponse(task, `Leave request ${action}d`));
    } catch (error) {
        next(error);
    }
};

exports.uploadTaskAttachment = async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return next(new ApiError('Task not found', 404));

        if (!req.file) return next(new ApiError('No file uploaded', 400));

        // Use your existing Cloudinary helper (adjust function name if yours is slightly different)
        const cloudinaryRes = await require('../utils/cloudinaryHelper').uploadOnCloudinary(req.file.path);

        if (!cloudinaryRes) {
            return next(new ApiError('Failed to upload to Cloudinary', 500));
        }

        const newAttachment = {
            name: req.file.originalname,
            url: cloudinaryRes.secure_url || cloudinaryRes.url,
            publicId: cloudinaryRes.public_id || '',
            uploadedAt: new Date()
        };

        task.attachments.push(newAttachment);

        // Track this upload in the changelog!
        task.changelog.push({
            user: req.user._id,
            field: 'Attachment Added',
            oldValue: 'None',
            newValue: req.file.originalname
        });

        await task.save();

        const populatedTask = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name avatar')
            .populate('changelog.user', 'name avatar');

        // Emit real-time update to the project room so the Kanban board updates instantly
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', populatedTask);

        res.status(200).json(new ApiResponse(populatedTask, 'File attached successfully'));
    } catch (error) {
        next(error);
    }
};