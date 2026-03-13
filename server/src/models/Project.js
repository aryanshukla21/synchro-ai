const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Project must have an owner']
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['Owner', 'Contributor', 'Viewer', 'Co-Owner'],
            default: 'Contributor'
        },
        status: {
            type: String,
            enum: ['Pending', 'Active'],
            default: 'Pending'
        }
    }],
    // SECURE STORAGE: For your encryption.js utility output
    aiApiKey: {
        type: new mongoose.Schema({
            iv: { type: String },
            content: { type: String }
        }, { _id: false }), // _id: false prevents creating an ID for this nested object
        select: false       // Now Mongoose correctly hides this field by default
    },

    // WORKSPACE INTEGRATIONS ---
    integrations: {
        geminiApiKey: {
            type: new mongoose.Schema({
                iv: { type: String },
                content: { type: String }
            }, { _id: false }),
            select: false // Hidden by default for security
        },
        githubToken: {
            type: new mongoose.Schema({
                iv: { type: String },
                content: { type: String }
            }, { _id: false }),
            select: false // Hidden by default for security
        },
        //Target Repository Path for PR Automation ---
        githubRepoPath: {
            type: String,
            default: ''
        }
    },

    // --- NEW: WORKSPACE NOTIFICATIONS ---
    notifications: {
        slack: { type: String, default: '' },
        discord: { type: String, default: '' },
        notifyOnSubmit: { type: Boolean, default: true },
        notifyOnMerge: { type: Boolean, default: true }
    },

    aiSummary: {
        type: String,
        default: 'Waiting for first task submission to generate summary...'
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    // Useful for monitoring project health in the dashboard
    status: {
        type: String,
        enum: ['Planning', 'Active', 'Completed'],
        default: 'Planning'
    }
}, {
    timestamps: true,
    // These allow virtual fields (like tasks) to show up in JSON responses
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// VIRTUAL: Automatically link tasks to the project without storing an array of IDs
projectSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'project'
});

module.exports = mongoose.model('Project', projectSchema);