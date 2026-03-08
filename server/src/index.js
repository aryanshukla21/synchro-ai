const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const connectDB = require('./config/db');

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

// Import Services
const notificationService = require('./services/notificationServices');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// --- CONFIGURATION ---
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Set security HTTP headers
app.use(helmet());

// Limit requests from same API
const limiter = rateLimit({
    max: 1000, // Limit each IP to 1000 requests per window (adjustable based on your traffic)
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
app.use(express.json({ limit: '10kb' })); // Limit body payload size to 10kb to prevent payload overflow attacks

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

// 5. Global Error Handling Middleware
// Replaced the generic inline handler with your robust custom error handler
app.use(errorHandler);

// --- SERVER STARTUP ---
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io initialized and listening for connections`);
});