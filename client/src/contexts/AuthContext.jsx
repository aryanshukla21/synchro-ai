import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

// 1. Export Context so the hook can access it
export const AuthContext = createContext();

// 2. AuthProvider Component (Keep this as the only major export)
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data.data);
                } catch (error) {
                    // Note: Our new axios interceptor will handle silent refresh attempts. 
                    // If it totally fails, it will wipe localStorage.
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setUser(data.data);
        return data;
    };

    const register = async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        return data;
    };

    const verifyOtp = async (email, otp) => {
        const { data } = await api.post('/auth/verify-otp', { email, otp });
        localStorage.setItem('token', data.data.token);
        // CRITICAL FIX: Ensure OTP verification also saves the refresh token
        if (data.data.refreshToken) {
            localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        setUser(data.data);
        return data;
    };

    const forgotPassword = async (email) => {
        const { data } = await api.post('/auth/forgot-password', { email });
        return data;
    };

    const resetPassword = async (token, password) => {
        const { data } = await api.put(`/auth/reset-password/${token}`, { password });
        return data;
    };

    const updateUserProfile = async (userData) => {
        // Since avatar uploads use FormData, we don't assume JSON here.
        // Axios interceptors handle the headers correctly.
        const { data } = await api.put('/auth/updatedetails', userData);
        setUser(data.data); // Update local state immediately
        return data;
    };

    // --- NEW: GOOGLE OAUTH LOGIN ---
    const googleLogin = async (credential) => {
        const { data } = await api.post('/auth/google', { credential });
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        setUser(data.data);

        // Return this flag so the UI knows if it needs to route to /setup-password
        return data.data.isNewGoogleUser;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            verifyOtp,
            forgotPassword,
            resetPassword,
            updateUserProfile,
            googleLogin, // <-- ADDED EXPORT
            logout,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};