const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const aIService = require('../services/aiServices');
const { ApiError } = require('../utils/apiResponse');

class ProjectService {

    async getProjectAnalytics(projectId) {
        const tasks = await Task.find({ project: projectId });

        if (tasks.length === 0) {
            return {
                completionPercentage: 0,
                status: 'Neutral'
            }
        }

        const completed = tasks.filter(t => t.status === 'Merged').length;
        const completionPercentage = Math.round((completed / tasks.length) * 100);

        let healthStatus = 'Healthy';
        if (completionPercentage < 30) healthStatus = 'At Risk';
        else if (completionPercentage < 70) healthStatus = 'On track';

        return {
            totalTasks: tasks.length,
            completedTasks: completed,
            completionPercentage,
            healthStatus
        };
    }

    async updateAIWorkspaceSummary(projectId) {
        try {
            // get recent activities for context
            const recentActivities = await Activity.find({ project: projectId })
                .sort({ createdAt: -1 })
                .limit(10);

            if (recentActivities.length === 0) return null;

            // call ai service to generate summary
            const summary = await aIService.generateProjectSummary(projectId, recentActivities);

            // update the project model
            return await Project.findByIdAndUpdate(
                projectId,
                { aiSummary: summary },
                { new: true }
            );
        } catch (error) {
            console.error("Failed to update AI Summary: ", error);
            return null;
        }
    }

    // check if user ahs specific role in a project
    async verifyMemberRole(projectId, userId, allowedRoles = []) {
        const project = await Project.findById(projectId);
        if (!project) throw new ApiError('Project not found', 404);

        const member = project.members.find(m => m.user.toString() === userId.toString());

        if (!member || !allowedRoles.includes(member.role)) {
            return false;
        }

        return true;
    }
}

module.exports = new ProjectService();