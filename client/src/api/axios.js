// client/src/api/axios.js
import axios from 'axios';

// Create an axios instance with your backend URL
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    // withCredentials: true, // Uncomment this if you later switch to storing tokens in HTTP-only cookies
});

// Request Interceptor: Attaches the Token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handles 401 (Unauthorized) errors globally with Token Rotation
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't already tried refreshing for this specific request
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark as retried to prevent infinite loops

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    // No refresh token available, purge everything and force logout
                    localStorage.clear();
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                // Request a new access token (Notice we use raw 'axios' here, NOT our 'api' instance
                // to prevent an infinite loop if the refresh route itself returns a 401)
                const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
                    token: refreshToken
                });

                // Extract the new token (matching your backend ApiResponse format)
                const newToken = response.data.data.token;

                // Save the newly minted access token
                localStorage.setItem('token', newToken);

                // Update the authorization header for the original failed request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;

                // Silently retry the original request with the new token
                return api(originalRequest);

            } catch (refreshError) {
                // If the refresh token itself is expired or invalid, boot the user out
                console.error('Refresh token expired or invalid, forcing logout.');
                localStorage.clear(); // Clears all auth data at once
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;