// Load environment variables
const dotenv = require('dotenv');
dotenv.config();

const validateEnv = () => {
    const requiredVars = [
        'MONGODB_URL',
        'JWT_SECRET',
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
        'SMTP_HOST',
        'SMTP_USER',
        'SMTP_PASS',
        'GEMINI_API_KEY',
        'ENCRYPTION_KEY' // NEW: Ensures encryption utility won't crash
    ];

    const missingVars = requiredVars.filter((key) => !process.env[key]);

    if (missingVars.length > 0) {
        console.error('❌ CRITICAL ERROR: Missing required environment variables:');
        missingVars.forEach((v) => console.error(`   - ${v}`));
        console.error('\nServer cannot start without these configurations. Exiting...\n');
        process.exit(1); // Force shutdown with failure code
    }

    console.log('✅ Environment validation passed.');
};

validateEnv();

const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');

// --- IMPORT FILE SYSTEM PACKAGES ---
const fs = require('fs');
const path = require('path');

// --- IMPORT SECURITY PACKAGES ---
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Import Config Helpers & Utilities
const socketHelper = require('./config/socket'); // Real-time socket manager
const { errorHandler } = require('./middleware/errorMiddleware'); // Global Error Handler

// Import Routes
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/task');
const submissionRoutes = require('./routes/submissions');
const activityRoutes = require('./routes/activities');
const notificationRoutes = require('./routes/notifications');
const commentRoutes = require('./routes/comments');
const workspaceRoutes = require('./routes/workspace');

// Import Services
const notificationService = require('./services/notificationServices');

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// --- Ensure temp directory exists for Multer ---
// This prevents "ENOENT: no such file or directory" crashes on deployment
const tempDir = path.join(__dirname, '../public/temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// --- CONFIGURATION ---
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Trust proxy is required if you are hosting on Render/Heroku/AWS/Vercel
// so the rate limiter doesn't block all users sharing the proxy IP.
app.set('trust proxy', 1);

// Set security HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: false,
}));

// Limit requests from same API
const limiter = rateLimit({
    max: 1500, // Limit each IP to 1500 requests per window (adjustable based on your traffic)
    windowMs: 60 * 60 * 1000, // 1 Hour
    message: 'Too many requests from this IP, please try again in an hour.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api', limiter); // Apply rate limiting to all /api routes

// 1. Standard Middleware
app.use(cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
}));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10mb' })); // Limit body payload size to 10mb to prevent payload overflow attacks

// Data sanitization against NoSQL query injection
// This removes any keys containing prohibited characters like $ or .
app.use(mongoSanitize());

// 2. Socket.io Setup
// CRITICAL: Initialize socket.io using the config/socket.js helper.
// This single line handles the CORS, the ping limits, and the room joining logic automatically.
const io = socketHelper.init(server);

// 3. Initialize Services with Socket.io
// Connects the notification service to the live socket
notificationService.init(io);

app.use((req, res, next) => {
    req.io = io;
    next();
});

// 4. Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/workspace', workspaceRoutes);

// 5. Global Error Handling Middleware
// Replaced the generic inline handler with your robust custom error handler
app.use(errorHandler);

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io initialized and listening for connections`);
});