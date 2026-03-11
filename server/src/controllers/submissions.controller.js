const Submission = require('../models/Submission');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { uploadOnCloudinary } = require('../utils/cloudinaryHelper');
const aiService = require('../services/aiServices');
const notificationService = require('../services/notificationServices');
const { ApiResponse, ApiError } = require('../utils/apiResponse');

exports.submitWork = async (req, res, next) => {
    try {
        const { taskId, comment } = req.body;
        let contentUrl = req.body.contentUrl;

        // 1. Initial Validation
        if (!taskId) {
            return next(new ApiError('Task ID is required', 400));
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return next(new ApiError('Task not found', 404));
        }

        // 2. Handle File Upload to Cloudinary if a file exists
        if (req.file) {
            const cloudinaryResponse = await uploadOnCloudinary(req.file.path, 'submissions');
            if (cloudinaryResponse) {
                // If a file is uploaded, we use the Cloudinary URL.
                contentUrl = cloudinaryResponse.secure_url;
            } else {
                return next(new ApiError('Failed to upload file to Cloudinary', 500));
            }
        }

        // 3. Final Content Validation
        if (!contentUrl) {
            return next(new ApiError('Please provide a file or a GitHub/Content URL', 400));
        }

        // 4. Create the submission record
        const submission = await Submission.create({
            task: taskId,
            submittedBy: req.user._id,
            contentUrl,
            comment: comment || ''
        });

        // 5. Update task status
        task.status = 'Review-Requested';
        await task.save();

        // 6. Log activity
        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `Submitted work for task: "${task.title}"`
        });

        res.status(201).json(new ApiResponse(submission, 'Work submitted for review successfully', 201));
    } catch (error) {
        next(error);
    }
};

exports.mergeWork = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Find submission and populate task
        const submission = await Submission.findById(id).populate('task');
        if (!submission) {
            return next(new ApiError('Submission not found', 404));
        }

        const task = submission.task;
        if (!task) {
            return next(new ApiError('Associated task not found', 404));
        }

        // Trigger AI Review Service with error boundary
        let aiReviewData = null;
        try {
            aiReviewData = await aiService.reviewSubmission(
                task.project,
                { title: task.title, description: task.description },
                `${submission.comment || ''} ${submission.contentUrl}`
            );
        } catch (aiError) {
            console.error("AI Review generation failed:", aiError);
            // We catch this so a Gemini API timeout doesn't block the manager from merging the work
        }

        // Update submission
        if (aiReviewData) {
            submission.aiReview = aiReviewData;
        }
        submission.status = 'Approved';
        await submission.save();

        // Finalize Task
        task.status = 'Merged';
        task.mergedBy = req.user._id;
        await task.save();

        // Audit Trail
        const actionText = aiReviewData
            ? `Merged task: "${task.title}" after AI Review (Score: ${aiReviewData.score})`
            : `Merged task: "${task.title}" (AI Review bypassed/unavailable)`;

        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: actionText
        });

        // Notify the user who submitted the work
        if (notificationService && typeof notificationService.notifyMerge === 'function') {
            await notificationService.notifyMerge(
                submission.submittedBy,
                req.user._id,
                task.title
            );
        }

        res.status(200).json(new ApiResponse(
            { submission, task },
            'Work successfully merged'
        ));
    } catch (error) {
        next(error);
    }
};

exports.getTaskSubmissions = async (req, res, next) => {
    try {
        const { taskId } = req.params;

        if (!taskId) {
            return next(new ApiError('Task ID is required', 400));
        }

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

        // Find all tasks belonging to this project
        const tasks = await Task.find({ project: projectId }).select('_id');
        const taskIds = tasks.map(t => t._id);

        // Find submissions for these tasks that have not been approved yet
        const submissions = await Submission.find({
            task: { $in: taskIds },
            status: { $ne: 'Approved' } // Adjust if your schema uses a different default status
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
        if (!submission) {
            return next(new ApiError('Submission not found', 404));
        }

        const task = submission.task;

        // Update submission and revert task status
        submission.status = 'Rejected';
        await submission.save();

        task.status = 'In-Progress'; // Send it back to the assigned user
        await task.save();

        // Log the rejection
        await Activity.create({
            project: task.project,
            user: req.user._id,
            action: `Rejected submission for task: "${task.title}"`
        });

        // Optional: Notify user
        if (notificationService && typeof notificationService.notifyRejection === 'function') {
            await notificationService.notifyRejection(
                submission.submittedBy,
                req.user._id,
                task.title
            );
        }

        res.status(200).json(new ApiResponse({ submission, task }, 'Work rejected and sent back'));
    } catch (error) {
        next(error);
    }
};