const axios = require('axios');
const { decrypt } = require('../utils/encryption');

/**
 * Service to handle GitHub automated Pull Request creation
 * @param {Object} project - The populated Project mongoose document
 * @param {Object} task - The Task mongoose document
 * @param {Object} submission - The Submission mongoose document
 * @returns {String|null} - The URL of the created Pull Request, or null if failed
 */
const createPullRequest = async (project, task, submission) => {
    try {
        // 1. Decrypt the GitHub Token from project integrations
        if (!project.integrations || !project.integrations.githubToken) {
            console.warn("GitHub integration not configured for this workspace.");
            return null;
        }

        const token = decrypt(project.integrations.githubToken);

        // 2. Parse GitHub Repository Info
        const repoPath = project.integrations.githubRepoPath || process.env.DEFAULT_GITHUB_REPO;

        if (!repoPath) {
            console.warn("No target GitHub repository path provided.");
            return null;
        }

        const authHeader = {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json'
        };

        // 3. Dynamically fetch the default branch (main, master, develop, etc.)
        const repoMetadataRes = await axios.get(`https://api.github.com/repos/${repoPath}`, { headers: authHeader });
        const defaultBranch = repoMetadataRes.data.default_branch;

        // 4. Get the latest commit SHA from the dynamic default branch
        const baseRefRes = await axios.get(`https://api.github.com/repos/${repoPath}/git/refs/heads/${defaultBranch}`, { headers: authHeader });
        const latestCommitSha = baseRefRes.data.object.sha;

        // 5. Create a new branch specifically for this task with a unique timestamp
        const timestamp = Date.now();
        const branchName = `task-${task._id}-${timestamp}`;

        await axios.post(`https://api.github.com/repos/${repoPath}/git/refs`, {
            ref: `refs/heads/${branchName}`,
            sha: latestCommitSha
        }, { headers: authHeader });

        // 6. Create a commit on the new branch so GitHub allows a PR (Empty Diff Fix)
        const fileContent = `# Synchro-AI Submission: ${task.title}\n\n**Description:**\n${task.description || 'N/A'}\n\n**Manager Notes:**\n${submission.comment || 'N/A'}\n\n**Work Link:** [View Attachment](${submission.contentUrl})`;

        // GitHub API requires file content to be Base64 encoded
        const base64Content = Buffer.from(fileContent).toString('base64');
        const filePath = `synchro-logs/task-${task._id}-${timestamp}.md`; // Unique filename to prevent collision

        // Commit the log file to the newly created branch
        await axios.put(`https://api.github.com/repos/${repoPath}/contents/${filePath}`, {
            message: `Automated Synchro-AI log for task: ${task.title}`,
            content: base64Content,
            branch: branchName
        }, { headers: authHeader });

        // 7. Create the Pull Request against the dynamic base branch
        const prBody = `## Task Context\n${task.description || 'No description provided.'}\n\n## Submission Notes\n${submission.comment || 'No comments provided.'}\n\n*Automatically generated and merged via the Synchro-AI Dashboard.*`;

        const prResponse = await axios.post(`https://api.github.com/repos/${repoPath}/pulls`, {
            title: `[Synchro-AI] ${task.title}`,
            head: branchName,
            base: defaultBranch,
            body: prBody
        }, { headers: authHeader });

        // Return the clickable HTML URL to store in your database
        return prResponse.data.html_url;

    } catch (error) {
        // Catch and log this so a failed GitHub API call doesn't crash the entire merge process
        console.error("GitHub PR Creation failed:", error.response?.data || error.message);
        return null;
    }
};

module.exports = { createPullRequest };