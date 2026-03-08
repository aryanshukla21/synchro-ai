const Notification = require('../models/Notification');
const { ApiError } = require('../utils/apiResponse');

class NotificationService {
    constructor() {
        this.io = null;
    };

    init(ioInstance) {
        this.io = ioInstance;
    };

    async notify({ recipient, sender, message, type }) {
        try {
            // save to database for persistence
            const notification = await Notification.create({
                recipient,
                sender,
                message,
                type
            });

            // populate sender details for the frontend ui
            const populatedNotify = await notification.populate('sender', 'name avatar');

            // emit real time event if socket is initialized
            if (this.io) {
                // FIXED: Changed 'new-notification' to 'newNotification' to match frontend
                this.io.to(recipient.toString()).emit('newNotification', populatedNotify);
            }

            return populatedNotify;
        } catch (error) {
            console.error('Notification Service Error', error);
            return null;
        }
    };

    // --- HELPER METHODS ---

    async notifyTaskAssignment(recipientId, senderId, taskTitle) {
        try {
            return this.notify({
                recipient: recipientId,
                sender: senderId,
                message: `You have been assigned the task: "${taskTitle}"`,
                type: 'Task'
            });
        } catch (error) {
            console.error("Error notifying task assignment:", error);
        }
    };

    async notifyTaskResponse(recipientId, senderId, taskTitle, response) {
        try {
            return this.notify({
                recipient: recipientId,
                sender: senderId,
                message: `${response} the task: "${taskTitle}"`, // e.g. "Accepted the task..."
                type: 'Task'
            });
        } catch (error) {
            console.error("Error notifying task response:", error);
        }
    }

    async notifyMerge(recipientId, senderId, taskTitle) {
        return this.notify({
            recipient: recipientId,
            sender: senderId,
            message: `Your work for "${taskTitle}" has been merged`,
            type: 'Merge'
        });
    };
}

module.exports = new NotificationService();