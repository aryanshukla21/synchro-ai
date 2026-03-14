const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: { type: String },

    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    // The person who created the task (The Owner)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // The person assigned to do the work
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },

    // WORKFLOW FIELDS
    assignmentStatus: {
        type: String,
        enum: ['Pending', 'Accepted', 'Declined'],
        default: 'Pending'
    },

    leaveRequested: {
        type: Boolean,
        default: false
    },

    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    status: {
        type: String,
        default: 'To-Do' // Defaults to the first column of the project in reality
    },
    metadata: {
        prLink: { type: String, default: '' },
        reviewNotes: { type: String, default: '' }
    },
    attachments: [{
        name: String,
        url: String,
        publicId: String,
        uploadedAt: { type: Date, default: Date.now }
    }],
    deadline: { type: Date },

    // TIMESHEET FIELD
    estimatedHours: { type: Number, default: 0 },

    // --- ISSUES / BUG TRACKER FIELDS ---
    type: {
        type: String,
        enum: ['Task', 'Bug'],
        default: 'Task'
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    environment: {
        type: String,
        enum: ['Development', 'Staging', 'Production'],
        default: 'Development'
    },
    stepsToReproduce: {
        type: String,
        default: ''
    },
    changelog: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        field: { type: String }, // e.g., "Status", "Priority", "Title"
        oldValue: { type: mongoose.Schema.Types.Mixed },
        newValue: { type: mongoose.Schema.Types.Mixed },
        changedAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);