const { ApiError } = require('../utils/apiResponse');

exports.errorHandler = (err, req, res, next) => {
    // 🔴 ADD THIS LINE RIGHT HERE:
    console.error("🔥 BACKEND ERROR CAUGHT:", err);

    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = new ApiError(message, 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = new ApiError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = new ApiError(message, 400);
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        details: error.details || null,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};