const Comment = require('../models/Comment');
const Task = require('../models/Task');
const notificationService = require('../services/notificationServices'); // ADDED
const socketHelper = require('../config/socket'); // ADDED
const { ApiResponse, ApiError } = require('../utils/apiResponse');

// Add a comment to a specific task
exports.addComment = async (req, res, next) => {
    try {
        const { taskId, text, attachments } = req.body;

        // Verify the task exists (changed variable name from 'tasks' to 'task' for accuracy)
        const task = await Task.findById(taskId);
        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // Create the comment
        const comment = await Comment.create({
            task: taskId,
            user: req.user._id,
            text,
            attachments: attachments || []
        });

        // Populate user details for immediate frontend display
        const populatedComment = await comment.populate('user', 'name avatar');

        // --- NEW: REAL-TIME COLLABORATION & NOTIFICATIONS ---

        // 1. Emit the new comment to the project room so others see it instantly
        socketHelper.emitToProjectRoom(task.project, 'commentAdded', populatedComment);

        // 2. Notify the Task Assignee (if the commenter isn't the assignee)
        if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
            await notificationService.notify({
                recipient: task.assignedTo,
                sender: req.user._id,
                message: `New comment on your task: "${task.title}"`,
                type: 'Comment'
            });
        }
        // 3. Alternatively, notify the Task Creator if the assignee is commenting
        else if (task.createdBy.toString() !== req.user._id.toString()) {
            await notificationService.notify({
                recipient: task.createdBy,
                sender: req.user._id,
                message: `New comment on task you created: "${task.title}"`,
                type: 'Comment'
            });
        }

        res.status(201).json(new ApiResponse(
            populatedComment,
            'Comment added successfully',
            201
        ));
    } catch (error) {
        next(error);
    }
};

// Get all comments for a specific task
exports.getTaskComments = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        const comments = await Comment.find({ task: taskId })
            .populate('user', 'name email avatar')
            .sort({ createdAt: 1 });

        res.status(200).json(new ApiResponse(
            comments,
            'Task comments retrieved successfully'
        ));

    } catch (error) {
        next(error);
    }
};

// Delete a specific comment
exports.deleteComment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const comment = await Comment.findById(id).populate('task');

        if (!comment) {
            return next(new ApiError('Comment not found', 404));
        }

        // Security: Ensure the user deleting the comment is the author
        if (comment.user.toString() !== req.user._id.toString()) {
            return next(new ApiError('You are not authorized to delete this comment', 403));
        }

        const taskId = comment.task._id;
        const projectId = comment.task.project;

        await comment.deleteOne();

        // --- NEW: REAL-TIME DELETION ---
        // Emit deletion to the room so the comment disappears instantly for everyone
        socketHelper.emitToProjectRoom(projectId, 'commentDeleted', {
            commentId: id,
            taskId: taskId
        });

        res.status(200).json(new ApiResponse(
            null,
            'Comment deleted successfully'
        ));
    } catch (error) {
        next(error);
    }
};