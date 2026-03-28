import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import { ShieldCheck, Loader2 } from 'lucide-react';

const SetupPassword = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) return showToast('Password must be at least 6 characters', 'error');

        setLoading(true);
        try {
            await api.post('/auth/set-password', { password });
            showToast('Account secured successfully!', 'success');
            navigate('/dashboard');
        } catch (error) {
            showToast(error.response?.data?.message || 'Action failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white p-4 sm:p-6">
            <div className="bg-[#1e293b] p-6 sm:p-8 rounded-xl border border-gray-700 w-full max-w-md shadow-2xl">
                <div className="flex justify-center text-emerald-400 mb-3 sm:mb-4">
                    <ShieldCheck size={40} className="sm:w-12 sm:h-12" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">Secure Your Account</h2>
                <p className="text-gray-400 text-center text-xs sm:text-sm mb-5 sm:mb-6">
                    You signed up via Google! Let's set a password so you can also log in directly using your email in the future.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-sm sm:text-base focus:border-indigo-500 outline-none transition"
                            placeholder="Enter 6+ characters"
                        />
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Set Password'}
                    </button>

                    <button type="button" onClick={() => navigate('/dashboard')} className="w-full mt-2 text-gray-500 hover:text-white transition text-xs sm:text-sm py-2">
                        Skip for now
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetupPassword;