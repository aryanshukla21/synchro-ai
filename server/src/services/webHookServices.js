const axios = require('axios');

/**
 * Service to send automated notifications to Slack and Discord
 * @param {Object} project - The populated Project mongoose document
 * @param {Object} messageData - { type: 'submission' | 'merge', title: String, userName: String, actionUrl: String }
 */
const sendWebhookNotification = async (project, messageData) => {
    // 1. Gracefully exit if no notifications are configured for this project
    if (!project || !project.notifications) return;

    const { slack, discord, notifyOnSubmit, notifyOnMerge } = project.notifications;
    const { type, title, userName, actionUrl } = messageData;

    // 2. Check if the manager has toggled off these specific event alerts
    if (type === 'submission' && !notifyOnSubmit) return;
    if (type === 'merge' && !notifyOnMerge) return;

    // Determine the call-to-action text based on the event type
    const actionText = type === 'submission' ? 'Review Submission' : 'View Project';

    // 3. Format and Dispatch for Slack
    // Slack uses * for bold and <url|text> for clickable links
    if (slack) {
        const slackText = type === 'submission'
            ? `🚀 *New Work Submitted*: ${title}\n👤 *Submitted by*: ${userName}\n🔗 <${actionUrl}|${actionText}>`
            : `✅ *Task Approved & Merged*: ${title}\n👤 *Approved by*: ${userName}\n🔗 <${actionUrl}|${actionText}>`;

        try {
            await axios.post(slack, { text: slackText });
        } catch (error) {
            console.error('Slack Webhook Error:', error.message);
        }
    }

    // 4. Format and Dispatch for Discord
    // Discord uses ** for bold and [text](url) for clickable links
    if (discord) {
        const discordText = type === 'submission'
            ? `🚀 **New Work Submitted**: ${title}\n👤 **Submitted by**: ${userName}\n🔗 [${actionText}](${actionUrl})`
            : `✅ **Task Approved & Merged**: ${title}\n👤 **Approved by**: ${userName}\n🔗 [${actionText}](${actionUrl})`;

        try {
            await axios.post(discord, { content: discordText });
        } catch (error) {
            console.error('Discord Webhook Error:', error.message);
        }
    }
};

module.exports = { sendWebhookNotification };