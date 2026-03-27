import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Layout, Zap, Shield, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Footer from '../components/Footer';

const Home = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans selection:bg-indigo-500/30 flex flex-col">

            {/* --- NAVBAR --- */}
            <nav className="border-b border-gray-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            S
                        </div>
                        <span className="tracking-tight">Synchro-AI</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        {user ? (
                            <>
                                <Link to="/dashboard" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg shadow-indigo-900/20 transition">
                                    Dashboard
                                </Link>
                                <button onClick={logout} className="text-sm font-medium hover:text-white transition hidden sm:block">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium hover:text-white transition hidden sm:block">Log in</Link>
                                <Link to="/register" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg shadow-indigo-900/20 transition">
                                    Get Started Free
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <main className="flex-1">
                <section className="relative pt-24 pb-32 px-6 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="container mx-auto max-w-4xl text-center relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
                            <Bot size={16} /> Powered by Gemini AI
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-8 leading-tight">
                            Synchronize Your Team's <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Intelligence.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            The ultimate collaborative workspace. Manage complex projects, chat in real-time, and let AI summarize your progress so you can focus on shipping.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link to={user ? "/dashboard" : "/register"} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-xl shadow-indigo-900/20 transition flex items-center justify-center gap-2 group">
                                {user ? "Go to Dashboard" : "Start Your Workspace"} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#features" className="w-full sm:w-auto px-8 py-4 bg-[#1e293b] hover:bg-gray-800 text-white rounded-full font-bold text-lg border border-gray-700 transition flex items-center justify-center">
                                View Features
                            </a>
                        </div>
                    </div>
                </section>

                {/* --- FEATURES SECTION --- */}
                <section id="features" className="py-24 bg-[#0B1121] border-y border-gray-800 px-6">
                    <div className="container mx-auto max-w-6xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to ship faster.</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">Built for modern engineering and product teams who want to reduce noise and increase velocity.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard icon={<Bot size={28} className="text-purple-400" />} title="AI Pulse Summaries" desc="Stop reading endless chat logs. Our Gemini integration generates instant summaries of project bottlenecks and progress." />
                            <FeatureCard icon={<Layout size={28} className="text-blue-400" />} title="Real-time Kanban" desc="Drag, drop, and sync instantly across all devices. Everyone sees updates the millisecond they happen." />
                            <FeatureCard icon={<Shield size={28} className="text-emerald-400" />} title="Enterprise Audit Logs" desc="Keep a precise history. Know exactly who changed a task status, invited a user, or uploaded a file." />
                            <FeatureCard icon={<Zap size={28} className="text-amber-400" />} title="Instant Communication" desc="Built-in Socket.io notifications and real-time task comments keep your team aligned without switching apps." />
                            <FeatureCard icon={<BarChart3 size={28} className="text-rose-400" />} title="Workload Analytics" desc="Visualize team bandwidth with beautiful Recharts dashboards to prevent burnout and optimize sprints." />
                            <FeatureCard icon={<Users size={28} className="text-indigo-400" />} title="Role-Based Access" desc="Secure your workspaces. Assign Admin, Member, or Viewer roles to safely collaborate with clients and contractors." />
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="bg-[#1e293b]/50 p-8 rounded-2xl border border-gray-700/50 hover:border-indigo-500/50 transition group">
        <div className="w-14 h-14 bg-[#0f172a] rounded-xl flex items-center justify-center border border-gray-700 mb-6 group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

export default Home;