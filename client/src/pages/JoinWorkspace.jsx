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
        // Verify token and get workspace details
        const verifyToken = async () => {
            try {
                // When you build the backend, it should verify the token and return the workspace name/role
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
            // Post the token to consume it and add the user to the workspace
            await api.post('/workspace/accept-invite', { token });
            showToast("Successfully joined the workspace!", "success");
            navigate('/'); // Send to dashboard
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to join workspace.", "error");
            setAccepting(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white">
                <Loader2 className="animate-spin mr-3" size={24} /> Verifying invitation...
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="text-red-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-white mb-2">Invitation Error</h1>
                <p className="text-gray-400 mb-6">{error}</p>
                <Link to="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition">
                    Go to Home
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans">
            <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in fade-in zoom-in duration-300">
                <ShieldCheck className="text-emerald-500 mx-auto mb-6" size={56} />
                <h1 className="text-2xl font-bold text-white mb-2">You've been invited!</h1>
                <p className="text-gray-400 mb-8">
                    You have been invited to join <span className="text-white font-bold">{inviteData?.workspaceName || 'a workspace'}</span> as a <span className="text-indigo-400 font-bold">{inviteData?.role || 'Member'}</span>.
                </p>

                {user ? (
                    // User is logged in: Show their profile and a 1-click accept button
                    <div className="space-y-4">
                        <div className="bg-[#0f172a] p-4 rounded-xl flex items-center justify-center gap-3 border border-gray-700">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.name?.charAt(0)}
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                                <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleAccept}
                            disabled={accepting}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20 disabled:opacity-50"
                        >
                            {accepting ? <Loader2 className="animate-spin" size={20} /> : 'Accept Invitation'}
                        </button>
                        <p className="text-xs text-gray-500 mt-4">
                            Not {user.name}? <button onClick={() => {/* Call your logout context here */ }} className="text-indigo-400 hover:underline">Switch accounts</button>
                        </p>
                    </div>
                ) : (
                    // User is NOT logged in: Prompt them to register or login and pass the token via URL
                    <div className="space-y-4">
                        <p className="text-sm text-gray-400 mb-4">You need an account to join this workspace.</p>
                        <button
                            onClick={() => navigate(`/register?inviteToken=${token}`)}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-indigo-900/20"
                        >
                            Create Account to Join <ArrowRight size={18} />
                        </button>
                        <p className="text-sm text-gray-400 mt-4">
                            Already have an account? <Link to={`/login?returnUrl=/join-workspace/${token}`} className="text-indigo-400 font-bold hover:text-indigo-300 transition">Log in</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JoinWorkspace;