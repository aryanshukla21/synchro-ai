const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { ApiResponse, ApiError } = require('../utils/apiResponse');

exports.logTime = async (req, res, next) => {
    try {
        const { taskId, date, hours, description } = req.body;

        const task = await Task.findById(taskId);
        if (!task) throw new ApiError(404, 'Task not found');

        const timeLog = await TimeLog.create({
            task: taskId,
            project: task.project,
            user: req.user._id,
            date,
            hours,
            description
        });

        res.status(201).json(new ApiResponse(timeLog, 'Time logged successfully'));
    } catch (error) {
        next(error);
    }
};

exports.getUserTimeLogs = async (req, res, next) => {
    try {
        const logs = await TimeLog.find({ user: req.user._id })
            .populate('task', 'title estimatedHours')
            .populate('project', 'title')
            .sort({ date: -1 });

        res.status(200).json(new ApiResponse(logs, 'User time logs retrieved'));
    } catch (error) {
        next(error);
    }
};

exports.getProjectTimeLogs = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const logs = await TimeLog.find({ project: projectId })
            .populate('task', 'title estimatedHours')
            .populate('user', 'name email avatar')
            .sort({ date: -1 });

        res.status(200).json(new ApiResponse(logs, 'Project time logs retrieved'));
    } catch (error) {
        next(error);
    }
};

exports.updateLogStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'Approved' or 'Rejected'

        const log = await TimeLog.findByIdAndUpdate(id, { status }, { new: true });
        if (!log) throw new ApiError(404, 'Time log not found');

        res.status(200).json(new ApiResponse(log, `Time log ${status.toLowerCase()}`));
    } catch (error) {
        next(error);
    }
};