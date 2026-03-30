const Project = require('../models/Project');
const User = require('../models/User');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { decrypt } = require('../utils/encryption');
const { ApiError } = require('../utils/apiResponse');

class AIService {

    async #getProjectApiKey(projectId) {
        // Fetch project and explicitly select the hidden aiApiKey field
        const project = await Project.findById(projectId).select("+aiApiKey");

        // 1. Check if the Project has a specific API key
        if (project && project.aiApiKey && project.aiApiKey.content) {
            return decrypt(project.aiApiKey);
        }

        // 2. FALLBACK: If no project key, check if the Owner has a Global API Key
        if (project && project.owner) {
            const owner = await User.findById(project.owner);
            if (owner && owner.geminiApiKey) {
                return owner.geminiApiKey; // Note: We didn't encrypt the global key in the DB per the current schema
            }
        }

        // 3. If neither exists, throw the error
        throw new ApiError("AI API Key not found for this project or user. Please configure it in profile or project settings.", 404);
    }

    async reviewSubmission(projectId, taskDetails, submissionContent) {
        try {
            const apiKey = await this.#getProjectApiKey(projectId);
            const genAI = new GoogleGenerativeAI(apiKey);

            // Use gemini-1.5-flash if available for speed, otherwise gemini-pro
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `
                As an expert project manager, review the following task submission.
                
                Task Details:
                - Title: ${taskDetails.title}
                - Description: ${taskDetails.description}
                
                Submitted Work:
                ${submissionContent}

                Output ONLY a raw JSON object (no markdown formatting) with these fields:
                1. "feedback": A detailed critique of the work.
                2. "score": A quality score from 1-100 (number).
                3. "passedAI": Boolean (true if score > 70).
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text();

            // CLEANUP: Remove Markdown code blocks if Gemini adds them
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(text);

        } catch (error) {
            console.error("AI review error:", error);
            // If JSON parse fails or API fails, return a graceful fallback
            if (error instanceof SyntaxError) {
                return {
                    feedback: "AI generated an invalid response format. Please review manually.",
                    score: 0,
                    passedAI: false
                };
            }
            throw new ApiError("Failed to generate AI review. Check your API key.", 500);
        }
    };

    async generateProjectSummary(projectId, activities) {
        try {
            const apiKey = await this.#getProjectApiKey(projectId);
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });

            // If no activities, return default message
            if (!activities || activities.length === 0) {
                return "No recent activity to summarize.";
            }

            const activityLog = activities.map(a => `- ${a.action} (by ${a.user?.name || 'User'})`).join("\n");

            const prompt = `
                Summarize the current progress of this project based on these recent activities:
                ${activityLog}

                Provide a concise 2-3 sentence status update suitable for a dashboard widget.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const summaryText = response.text();

            // Update Project in DB
            await Project.findByIdAndUpdate(projectId, {
                aiSummary: summaryText
            });

            return summaryText;
        } catch (error) {
            console.error("AI Summary error:", error.message);
            // Return null or generic string so the frontend doesn't break
            return "Unable to update AI summary at this time. Please check your API key configuration.";
        }
    }
}

module.exports = new AIService();