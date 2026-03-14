const { Server } = require('socket.io');

let io;

module.exports = {
    // Initialize Socket.io with your HTTP server
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:5173',
                methods: ['GET', 'POST'],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000, // FIXED TYPO: pingINterval -> pingInterval
            transports: ['websocket', 'polling']
        });

        io.on('connection', (socket) => {
            console.log('User connected to socket:', socket.id);

            // 1. Join Personal Room (For user-specific notifications)
            const userId = socket.handshake.query.userId;
            if (userId) {
                socket.join(userId.toString());
            }

            // 2. Join Project Room (For real-time Kanban Board updates)
            socket.on('joinProject', (projectId) => {
                socket.join(`project_${projectId}`);
            });

            // 3. Leave Project Room
            socket.on('leaveProject', (projectId) => {
                socket.leave(`project_${projectId}`);
            });

            // --- TASK LOCKING & PRESENCE INDICATORS ---
            socket.on('task-typing-start', ({ projectId, taskId, user }) => {
                // Broadcast to everyone ELSE in the project room that this user is editing this specific task
                socket.to(`project_${projectId}`).emit('task-being-edited', { taskId, user });
            });

            socket.on('task-typing-stop', ({ projectId, taskId, user }) => {
                // Broadcast that the user has stopped editing
                socket.to(`project_${projectId}`).emit('task-stopped-editing', { taskId, user });
            });

            socket.on('disconnect', () => {
                console.log('User disconnected:', socket.id);
                // Socket.io automatically handles room cleanup on disconnect
            });
        });

        return io;
    },

    // Retrieve the initialized io instance
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized! Call init(httpServer) first.');
        }
        return io;
    },

    // Helper function to easily emit events to a specific project board
    emitToProjectRoom: (projectId, event, payload) => {
        if (io) {
            io.to(`project_${projectId}`).emit(event, payload);
        }
    },

    // --- NEW: Helper function to emit events directly to a specific user ---
    emitToUser: (userId, event, payload) => {
        if (io) {
            // Emits directly to the personal room created in the connection block
            io.to(userId.toString()).emit(event, payload);
        }
    }
};