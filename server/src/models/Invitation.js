const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project', // Assuming Project acts as your Workspace
        required: true
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        expires: 0 // MongoDB TTL index: automatically deletes the document when this date is reached
    }
}, { timestamps: true });

module.exports = mongoose.model('Invitation', invitationSchema);