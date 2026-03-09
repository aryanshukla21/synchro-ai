class ApiResponse {
    constructor(data, message = 'Success', statusCode = 200, pagination = null) {
        // Automatically determine success based on HTTP status code
        this.success = statusCode < 400;
        this.data = data;
        this.message = message;
        this.statusCode = statusCode;

        // CRITICAL FIX: Attach the pagination object to the response if it exists
        if (pagination) {
            this.pagination = pagination;
        }
    }
}

class ApiError extends Error {
    constructor(message = "Something went wrong", statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.success = false;

        // Capture the stack trace for easier debugging in development
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = { ApiResponse, ApiError };