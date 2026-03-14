const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Comment = require('../models/Comment');
const { ApiResponse, ApiError } = require('../utils/apiResponse');

exports.globalSearch = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(200).json(new ApiResponse({ projects: [], tasks: [], users: [], comments: [] }, "Empty search query"));
        }

        const searchRegex = new RegExp(q, 'i');
        const userId = req.user._id;

        // Run all 4 queries concurrently for performance
        const [projects, tasks, users, comments] = await Promise.all([
            Project.find({
                $or: [{ title: searchRegex }, { description: searchRegex }],
                $or: [{ owner: userId }, { 'members.user': userId }] // Only projects user has access to
            }).select('title description status').limit(10),

            Task.find({
                $or: [{ title: searchRegex }, { description: searchRegex }],
                $or: [{ assignees: userId }, { creator: userId }] // Tasks relevant to user
            }).select('title status priority project').populate('project', 'title').limit(15),

            User.find({
                $or: [{ name: searchRegex }, { email: searchRegex }]
            }).select('name email avatar').limit(10),

            Comment.find({
                text: searchRegex,
                author: userId // Assuming we search their own comments for privacy, or broaden if needed
            }).select('text task createdAt').populate('task', 'title').limit(10)
        ]);

        res.status(200).json(new ApiResponse({
            projects,
            tasks,
            users,
            comments
        }, 'Global search results retrieved successfully'));

    } catch (error) {
        next(error);
    }
};