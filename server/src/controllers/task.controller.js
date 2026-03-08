const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const { ApiResponse, ApiError } = require('../utils/apiResponse');
const notificationService = require('../services/notificationServices');
const sendEmail = require('../services/emailServices');
const socketHelper = require('../config/socket'); // ADDED: Import socket helper

// 1. Create Task (Restricted to Project Owner)
exports.createTask = async (req, res, next) => {
    try {
        const { title, description, projectId, assignedTo, priority, deadline } = req.body;

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
            leaveRequested: false
        });

        await Activity.create({
            project: projectId,
            user: req.user._id,
            action: `Created task: "${task.title}"`
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

        // ADDED: Emit real-time creation to the project room
        socketHelper.emitToProjectRoom(projectId, 'taskCreated', populatedTask);

        res.status(201).json(new ApiResponse(populatedTask, 'Task created successfully'));
    } catch (error) {
        next(error);
    }
};

// 2. Generic Update Task
exports.updateTask = async (req, res, next) => {
    try {
        const { title, description, priority, deadline, assignedTo, status } = req.body;

        const taskToCheck = await Task.findById(req.params.id);
        if (!taskToCheck) return next(new ApiError('Task not found', 404));

        // Ownership Check
        if (taskToCheck.createdBy.toString() !== req.user._id.toString()) {
            return next(new ApiError('Only the task owner can edit task details', 403));
        }

        let updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (priority) updateData.priority = priority;
        if (deadline) updateData.deadline = deadline;
        if (status) updateData.status = status;

        if (assignedTo !== undefined) {
            if (assignedTo === '' || assignedTo === 'null' || assignedTo === null) {
                updateData.assignedTo = null;
                updateData.assignmentStatus = 'Pending';
            } else {
                updateData.assignedTo = assignedTo;
                updateData.assignmentStatus = 'Pending';

                // Notify new assignee
                await notificationService.notifyTaskAssignment(assignedTo, req.user._id, taskToCheck.title);
            }
        }

        const task = await Task.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true
        })
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name');

        // ADDED: Emit real-time update to the project room
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', task);

        res.status(200).json(new ApiResponse(task, 'Task updated successfully'));
    } catch (error) {
        next(error);
    }
};

// 3. Respond to Assignment (Accept/Decline) -> Notify Admin + Email
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
        await task.save();

        // NOTIFICATION: Notify Owner (Admin)
        await notificationService.notifyTaskResponse(
            task.createdBy._id,
            req.user._id,
            task.title,
            action
        );

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `${action}ed task assignment: "${task.title}"`
        });

        // EMAIL: Notify Owner
        await sendEmail({
            email: task.createdBy.email,
            subject: `Task ${action}ed: ${task.title}`,
            message: `The user ${req.user.name} has ${action.toLowerCase()}ed the task assignment for "${task.title}".`
        });

        task = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name');

        // ADDED: Emit real-time update
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', task);

        res.status(200).json(new ApiResponse(task, `Task assignment ${action}ed`));
    } catch (error) {
        next(error);
    }
};

// 4. Update Task Status (To-Do -> In-Progress) -> Notify Owner
exports.updateTaskStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const validStatuses = ['To-Do', 'In-Progress', 'Submitted', 'Merged'];
        if (!validStatuses.includes(status)) return next(new ApiError('Invalid status', 400));

        let task = await Task.findById(req.params.id);
        if (!task) return next(new ApiError('Task not found', 404));

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

        task = await Task.findById(task._id)
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name');

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `Moved "${task.title}" to ${status}`
        });

        // ADDED: Emit real-time status change to trigger drag-and-drop visuals for others
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', task);

        res.status(200).json(new ApiResponse(task, `Task status updated to ${status}`));
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

        // ADDED: Emit real-time update
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

exports.getProjectTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json(new ApiResponse(tasks, 'Project tasks retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.getMyTasks = async (req, res, next) => {
    try {
        const tasks = await Task.find({
            assignedTo: req.user._id,
            assignmentStatus: { $ne: 'Declined' }
        })
            .populate('project', 'title description')
            .populate('assignedTo', 'name email avatar')
            .populate('createdBy', 'name')
            .sort({ deadline: 1 });

        res.status(200).json(new ApiResponse(tasks, 'User tasks fetched successfully'));
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

        // ADDED: Emit real-time update so the task un-assigns visually
        socketHelper.emitToProjectRoom(task.project, 'taskUpdated', task);

        res.status(200).json(new ApiResponse(task, `Leave request ${action}d`));
    } catch (error) {
        next(error);
    }
};