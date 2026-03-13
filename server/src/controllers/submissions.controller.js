const fs = require('fs'); // CRITICAL: Required for local temp file cleanup
const Submission = require('../models/Submission');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const { uploadOnCloudinary } = require('../utils/cloudinaryHelper');
const aiService = require('../services/aiServices');

// --- INTEGRATION SERVICES ---
const { emitToProjectRoom, emitToUser } = require('../config/socket');
const { sendWebhookNotification } = require('../services/webhookServices');
const { createPullRequest } = require('../services/githubServices');
const notificationService = require('../services/notificationServices');
const { ApiResponse, ApiError } = require('../utils/apiResponse');

exports.submitWork = async (req, res, next) => {
    try {
        const { taskId, comment } = req.body;
        let contentUrl = req.body.contentUrl;

        // 1. Initial Validation
        if (!taskId) return next(new ApiError('Task ID is required', 400));

        const task = await Task.findById(taskId);
        if (!task) return next(new ApiError('Task not found', 404));

        // 2. Handle File Upload with Strict Memory Cleanup
        if (req.file) {
            try {
                const cloudinaryResponse = await uploadOnCloudinary(req.file.path, 'submissions');
                if (cloudinaryResponse) {
                    contentUrl = cloudinaryResponse.secure_url;
                } else {
                    return next(new ApiError('Failed to upload file to Cloudinary', 500));
                }
            } catch (uploadErr) {
                console.error("Cloudinary upload error:", uploadErr);
                return next(new ApiError('Error during file upload', 500));
            } finally {
                // Prevent server storage from filling up
                if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            }
        }

        if (!contentUrl) return next(new ApiError('Please provide a file or a Content URL', 400));

        // 3. Create Record & Update Task
        const submission = await Submission.create({
            task: taskId,
            submittedBy: req.user._id,
            contentUrl,
            comment: comment || ''
        });

        task.status = 'Review-Requested';
        await task.save();

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `Submitted work for task: "${task.title}"`
        });

        // 4. Dispatch Notifications
        const populatedProject = await Project.findById(task.project);
        if (populatedProject) {
            // A. External Webhooks
            await sendWebhookNotification(populatedProject, {
                type: 'submission',
                title: task.title,
                userName: req.user.name,
                actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/project/${task.project}/reviews`
            });

            // B. Real-Time UI Sockets
            populatedProject.members.forEach(member => {
                if (member.role === 'Owner' || member.role === 'Co-Owner') {
                    emitToUser(member.user.toString(), 'new-notification', {
                        message: `${req.user.name} submitted work for "${task.title}"`,
                        type: 'info'
                    });
                }
            });
            emitToProjectRoom(task.project.toString(), 'task-updated', task);
        }

        res.status(201).json(new ApiResponse(submission, 'Work submitted for review successfully', 201));
    } catch (error) {
        next(error);
    }
};

exports.mergeWork = async (req, res, next) => {
    try {
        const { id } = req.params;

        const submission = await Submission.findById(id).populate('task');
        if (!submission) return next(new ApiError('Submission not found', 404));

        const task = submission.task;
        if (!task) return next(new ApiError('Associated task not found', 404));

        const project = await Project.findById(task.project).select('+integrations.githubToken +integrations.geminiApiKey');

        // 1. External AI Review (Wrapped to prevent blocks on timeout)
        let aiReviewData = null;
        try {
            aiReviewData = await aiService.reviewSubmission(
                task.project,
                { title: task.title, description: task.description },
                `${submission.comment || ''} ${submission.contentUrl}`
            );
        } catch (aiError) {
            console.error("AI Review generation failed:", aiError);
        }

        // 2. Automated GitHub PR Generation
        let githubPrUrl = null;
        if (project && project.integrations?.githubToken) {
            githubPrUrl = await createPullRequest(project, task, submission);
        }

        // 3. Finalize Database Records
        if (aiReviewData) submission.aiReview = aiReviewData;
        if (githubPrUrl) submission.githubPrUrl = githubPrUrl;
        submission.status = 'Approved';
        await submission.save();

        task.status = 'Merged';
        task.mergedBy = req.user._id;
        await task.save();

        let actionText = `Merged task: "${task.title}"`;
        if (aiReviewData) actionText += ` (AI Score: ${aiReviewData.score})`;
        if (githubPrUrl) actionText += ` | Created PR: ${githubPrUrl}`;

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: actionText
        });

        // 4. Dispatch Notifications
        if (project) {
            await sendWebhookNotification(project, {
                type: 'merge',
                title: task.title,
                userName: req.user.name,
                actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/project/${project._id}`
            });
            emitToProjectRoom(project._id.toString(), 'task-updated', task);
        }

        emitToUser(submission.submittedBy.toString(), 'new-notification', {
            message: `Your work for "${task.title}" was approved & merged!`,
            type: 'success'
        });

        // Save persistent notification to DB if the service exists
        if (notificationService && typeof notificationService.notifyMerge === 'function') {
            await notificationService.notifyMerge(submission.submittedBy, req.user._id, task.title);
        }

        res.status(200).json(new ApiResponse(
            { submission, task, githubPrUrl },
            'Work successfully merged'
        ));
    } catch (error) {
        next(error);
    }
};

exports.getTaskSubmissions = async (req, res, next) => {
    try {
        const { taskId } = req.params;
        if (!taskId) return next(new ApiError('Task ID is required', 400));

        const submissions = await Submission.find({ task: taskId })
            .populate('submittedBy', 'name email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json(new ApiResponse(submissions, 'Submissions retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.getProjectSubmissions = async (req, res, next) => {
    try {
        const { projectId } = req.params;

        const tasks = await Task.find({ project: projectId }).select('_id');
        const taskIds = tasks.map(t => t._id);

        const submissions = await Submission.find({
            task: { $in: taskIds },
            status: { $ne: 'Approved' }
        })
            .populate('task', 'title status deadline')
            .populate('submittedBy', 'name email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json(new ApiResponse(submissions, 'Project submissions retrieved successfully'));
    } catch (error) {
        next(error);
    }
};

exports.rejectWork = async (req, res, next) => {
    try {
        const { id } = req.params;

        const submission = await Submission.findById(id).populate('task');
        if (!submission) return next(new ApiError('Submission not found', 404));

        const task = submission.task;

        // 1. Revert Statuses
        submission.status = 'Rejected';
        await submission.save();

        task.status = 'In-Progress';
        await task.save();

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `Rejected submission for task: "${task.title}"`
        });

        // 2. Dispatch Notifications
        emitToProjectRoom(task.project.toString(), 'task-updated', task);

        emitToUser(submission.submittedBy.toString(), 'new-notification', {
            message: `Your work for "${task.title}" requires revisions.`,
            type: 'error'
        });

        // Save persistent notification to DB if the service exists
        if (notificationService && typeof notificationService.notifyRejection === 'function') {
            await notificationService.notifyRejection(submission.submittedBy, req.user._id, task.title);
        }

        res.status(200).json(new ApiResponse({ submission, task }, 'Work rejected and sent back'));
    } catch (error) {
        next(error);
    }
};