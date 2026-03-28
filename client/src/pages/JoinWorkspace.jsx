import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { ShieldCheck, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

const JoinWorkspace = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { showToast } = useToast();

    const [inviteData, setInviteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [accepting, setAccepting] = useState(false);

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const { data } = await api.get(`/workspace/invite-details/${token}`);
                setInviteData(data.data);
            } catch (err) {
                setError(err.response?.data?.message || "Invalid or expired invitation link.");
            } finally {
                setLoading(false);
            }
        };
        verifyToken();
    }, [token]);

    const handleAccept = async () => {
        setAccepting(true);
        try {
            await api.post('/workspace/accept-invite', { token });
            showToast("Successfully joined the workspace!", "success");
            navigate('/');
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to join workspace.", "error");
            setAccepting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white text-sm sm:text-base">
                <Loader2 className="animate-spin mr-2 sm:mr-3 sm:w-6 sm:h-6" size={20} /> Verifying invitation...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 sm:p-6 text-center">
                <AlertTriangle className="text-red-500 mb-3 sm:mb-4 sm:w-12 sm:h-12" size={40} />
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Invitation Error</h1>
                <p className="text-xs sm:text-sm text-gray-400 mb-5 sm:mb-6 max-w-sm">{error}</p>
                <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-bold transition">
                    Go to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6 font-sans">
            <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                <ShieldCheck className="text-emerald-500 mx-auto mb-4 sm:mb-6 sm:w-[56px] sm:h-[56px]" size={48} />
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">You've been invited!</h1>
                <p className="text-xs sm:text-sm text-gray-400 mb-6 sm:mb-8 px-2 sm:px-0">
                    You have been invited to join <span className="text-white font-bold">{inviteData?.workspaceName || 'a workspace'}</span> as a <span className="text-indigo-400 font-bold">{inviteData?.role || 'Member'}</span>.
                </p>

                {user ? (
                    <div className="space-y-4">
                        <div className="bg-[#0f172a] p-3 sm:p-4 rounded-xl flex items-center justify-center gap-3 border border-gray-700">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden shrink-0">
                                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                            </div>
                            <div className="text-left min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-white leading-tight truncate">{user.name}</p>
                                <p className="text-[10px] sm:text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                        >
                            {accepting ? <Loader2 className="animate-spin sm:w-5 sm:h-5" size={18} /> : 'Accept Invitation'}
                        </button>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4">
                            Not {user.name}? <button onClick={() => {/* Call logout context if needed */ }} className="text-indigo-400 hover:underline">Switch accounts</button>
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4 px-2">You need an account to join this workspace.</p>
                        <button
                            onClick={() => navigate(`/register?inviteToken=${token}`)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/20"
                        >
                            Create Account to Join <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                        </button>
                        <p className="text-xs sm:text-sm text-gray-400 mt-3 sm:mt-4">
                            Already have an account? <Link to={`/login?returnUrl=/join-workspace/${token}`} className="text-indigo-400 font-bold hover:text-indigo-300 transition">Log in</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinWorkspace;