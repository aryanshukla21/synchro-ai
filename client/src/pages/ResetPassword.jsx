import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, Loader2 } from 'lucide-react';

const ResetPassword = () => {
    const { token } = useParams();
    const { resetPassword } = useAuth();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            return setError("Passwords don't match");
        }
        if (password.length < 6) {
            return setError("Password must be at least 6 characters");
        }

        setLoading(true);
        try {
            await resetPassword(token, password);
            alert('Password reset successfully! Redirecting to login...');
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Link may be expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-md w-full bg-[#1e293b] p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reset Password</h2>
                    <p className="text-xs sm:text-sm text-gray-400">Enter your new secure password</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-5 sm:mb-6 text-xs sm:text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                <Lock size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-[#0f172a] border border-gray-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 transition"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                <Lock size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </div>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-[#0f172a] border border-gray-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 transition"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-70"
                    >
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : <>Reset Password <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /></>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;