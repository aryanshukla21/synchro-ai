const Activity = require('../models/Activity');
const { ApiResponse, ApiError } = require('../utils/apiResponse');

// get all activity logs for a specific project
exports.getProjectActivities = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { page = 1, limit = 20, search = '', userId, startDate, endDate } = req.query;

        const query = { project: projectId };

        // Apply filters if provided
        if (userId) {
            query.user = userId;
        }

        if (search) {
            query.action = { $regex: search, $options: 'i' };
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set the end date to the end of the day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch counts for pagination math
        const total = await Activity.countDocuments(query);

        const activities = await Activity.find(query)
            .populate('user', 'name email avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json(new ApiResponse(
            activities,
            'Project activity logs retrieved successfully',
            200,
            {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        ));
    }
    catch (error) {
        next(error);
    }
};

exports.getUserActivities = async (req, res, next) => {
    try {
        const activities = await Activity.find({ user: req.user._id })
            .populate('project', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json(new ApiResponse(
            activities,
            'Personal activity logs retrieved successfully'
        ));
    } catch (error) {
        next(error);
    }
};