import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api/axios';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [otp, setOtp] = useState('');

    const { register, verifyOtp, googleLogin } = useAuth();
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const inviteToken = searchParams.get('inviteToken');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(formData.name, formData.email, formData.password);
            setStep(2);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await verifyOtp(formData.email, otp);
            if (inviteToken) {
                try {
                    await api.post('/workspace/accept-invite', { token: inviteToken });
                } catch (inviteErr) {
                    console.error("Failed to automatically join workspace:", inviteErr);
                }
            }
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute bottom-[20%] left-[10%] w-64 sm:w-96 h-64 sm:h-96 bg-indigo-900/20 rounded-full mix-blend-screen filter blur-[80px] sm:blur-[100px] opacity-30"></div>
                <div className="absolute top-[10%] right-[10%] w-48 sm:w-72 h-48 sm:h-72 bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[60px] sm:blur-[80px] opacity-30"></div>
            </div>

            <div className="max-w-md w-full bg-[#1e293b] p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 relative z-10">
                <div className="text-center mb-6 sm:mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {step === 1 ? 'Create Account' : 'Verify Email'}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400">
                        {step === 1
                            ? (inviteToken ? 'Create an account to join the workspace' : 'Join Synchro-AI and start collaborating')
                            : `We sent a code to ${formData.email}`}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-5 sm:mb-6 flex items-center gap-2 text-xs sm:text-sm">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                {step === 1 ? (
                    <>
                        <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-[#0f172a] border border-gray-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-600"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <Mail size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-[#0f172a] border border-gray-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-600"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                        <Lock size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </div>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-[#0f172a] border border-gray-600 rounded-lg text-sm sm:text-base text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-600"
                                        placeholder="Create a password"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? 'Sending OTP...' : (
                                    <>Next Step <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" /></>
                                )}
                            </button>
                        </form>

                        {/* --- GOOGLE OAUTH SECTION --- */}
                        <div className="mt-6">
                            <div className="relative mb-5 sm:mb-6">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                                <div className="relative flex justify-center text-[10px] sm:text-sm">
                                    <span className="px-2 bg-[#1e293b] text-gray-400">Or sign up with</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={async (credentialResponse) => {
                                        try {
                                            setLoading(true);
                                            const isNewUser = await googleLogin(credentialResponse.credential);

                                            if (inviteToken) {
                                                try {
                                                    await api.post('/workspace/accept-invite', { token: inviteToken });
                                                } catch (inviteErr) {
                                                    console.error("Failed to automatically join workspace:", inviteErr);
                                                }
                                            }

                                            if (isNewUser) navigate('/setup-password');
                                            else navigate('/');
                                        } catch (err) {
                                            setError('Google Signup failed. Please try again.');
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    onError={() => setError('Google signup was unsuccessful.')}
                                    theme="filled_black"
                                    shape="pill"
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-5">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5">Verification Code</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                                    <KeyRound size={16} className="sm:w-[18px] sm:h-[18px]" />
                                </div>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 bg-[#0f172a] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-gray-600 tracking-widest text-base sm:text-lg"
                                    placeholder="XXXXXX"
                                    maxLength="6"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Verifying...' : (
                                <>Verify & Login <CheckCircle2 size={16} className="sm:w-[18px] sm:h-[18px]" /></>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-xs sm:text-sm text-gray-400 hover:text-white transition"
                        >
                            Change Email
                        </button>
                    </form>
                )}

                {step === 1 && (
                    <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link to={inviteToken ? `/login?returnUrl=/join-workspace/${inviteToken}` : '/login'} className="text-indigo-400 hover:text-indigo-300 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
};

export default Register;