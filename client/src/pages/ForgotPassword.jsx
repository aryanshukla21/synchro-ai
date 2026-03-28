import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const { forgotPassword } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await forgotPassword(email);
            setMessage('Password reset email sent! Check your inbox.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6">
            <div className="max-w-md w-full bg-[#1e293b] p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Forgot Password?</h2>
                    <p className="text-xs sm:text-sm text-gray-400">Enter your email to reset your password</p>
                </div>

                {message ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-center text-sm sm:text-base">
                        <div className="flex justify-center mb-2"><CheckCircle2 size={28} className="sm:w-8 sm:h-8" /></div>
                        <p>{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs sm:text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-[#0f172a] border border-gray-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-70"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> Sending...</> : <>Send Reset Link <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" /></>}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/login" className="text-gray-400 hover:text-white flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm transition">
                        <ArrowLeft size={14} className="sm:w-4 sm:h-4" /> Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;