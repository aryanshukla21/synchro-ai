import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Layout, Zap, Shield, CheckCircle2, Users, BarChart3 } from 'lucide-react';

const Home = () => {
    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans selection:bg-indigo-500/30">

            {/* --- NAVBAR --- */}
            <nav className="border-b border-gray-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white font-bold text-xl">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                            S
                        </div>
                        <span className="tracking-tight">Synchro-AI</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link to="/login" className="text-sm font-medium hover:text-white transition hidden sm:block">Log in</Link>
                        <Link to="/register" className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full shadow-lg shadow-indigo-900/20 transition">
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <main>
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
                            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-xl shadow-indigo-900/20 transition flex items-center justify-center gap-2 group">
                                Start Your Workspace <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
                            <FeatureCard
                                icon={<Bot size={28} className="text-purple-400" />}
                                title="AI Pulse Summaries"
                                desc="Stop reading endless chat logs. Our Gemini integration generates instant summaries of project bottlenecks and progress."
                            />
                            <FeatureCard
                                icon={<Layout size={28} className="text-blue-400" />}
                                title="Real-time Kanban"
                                desc="Drag, drop, and sync instantly across all devices. Everyone sees updates the millisecond they happen."
                            />
                            <FeatureCard
                                icon={<Shield size={28} className="text-emerald-400" />}
                                title="Enterprise Audit Logs"
                                desc="Keep a precise history. Know exactly who changed a task status, invited a user, or uploaded a file."
                            />
                            <FeatureCard
                                icon={<Zap size={28} className="text-amber-400" />}
                                title="Instant Communication"
                                desc="Built-in Socket.io notifications and real-time task comments keep your team aligned without switching apps."
                            />
                            <FeatureCard
                                icon={<BarChart3 size={28} className="text-rose-400" />}
                                title="Workload Analytics"
                                desc="Visualize team bandwidth with beautiful Recharts dashboards to prevent burnout and optimize sprints."
                            />
                            <FeatureCard
                                icon={<Users size={28} className="text-indigo-400" />}
                                title="Role-Based Access"
                                desc="Secure your workspaces. Assign Admin, Member, or Viewer roles to safely collaborate with clients and contractors."
                            />
                        </div>
                    </div>
                </section>

                {/* --- PRICING SECTION --- */}
                <section className="py-24 px-6 relative">
                    <div className="container mx-auto max-w-5xl">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, transparent pricing.</h2>
                            <p className="text-gray-400">Start for free, upgrade when your team needs more power.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <PricingCard
                                name="Basic"
                                price="Free"
                                desc="Perfect for individuals and small side projects."
                                features={["Up to 3 Workspaces", "Basic Kanban Board", "Real-time Chat", "Standard Support"]}
                                buttonText="Get Started"
                                link="/register"
                            />
                            <PricingCard
                                name="Pro"
                                price="$10"
                                period="/mo per user"
                                desc="For teams that need AI power and deep analytics."
                                features={["Unlimited Workspaces", "Gemini AI Pulse Summaries", "Enterprise Audit Logs", "Advanced Analytics", "Priority Support"]}
                                buttonText="Start Free Trial"
                                link="/register"
                                highlighted={true}
                            />
                            <PricingCard
                                name="Enterprise"
                                price="Custom"
                                desc="For large organizations requiring ultimate control."
                                features={["Dedicated Infrastructure", "Custom AI Fine-tuning", "SSO Authentication", "24/7 Phone Support"]}
                                buttonText="Contact Sales"
                                link="mailto:support@synchro-ai.com"
                            />
                        </div>
                    </div>
                </section>

                {/* --- FOOTER --- */}
                <footer className="border-t border-gray-800 bg-[#0B1121] py-12 px-6">
                    <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2 text-white font-bold text-xl">
                            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white text-xs">S</div>
                            Synchro-AI
                        </div>
                        <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Synchro-AI. All rights reserved.</p>
                        <div className="flex gap-6 text-sm font-medium text-gray-400">
                            <a href="#" className="hover:text-white transition">Privacy</a>
                            <a href="#" className="hover:text-white transition">Terms</a>
                            <a href="#" className="hover:text-white transition">Twitter</a>
                        </div>
                    </div>
                </footer>
            </main>
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

const PricingCard = ({ name, price, period, desc, features, buttonText, link, highlighted }) => (
    <div className={`p-8 rounded-2xl border flex flex-col ${highlighted ? 'bg-indigo-900/20 border-indigo-500 shadow-2xl shadow-indigo-900/20 relative' : 'bg-[#1e293b] border-gray-700'}`}>
        {highlighted && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>}
        <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
        <p className="text-gray-400 text-sm mb-6 h-10">{desc}</p>
        <div className="mb-8 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-white">{price}</span>
            {period && <span className="text-gray-400 font-medium">{period}</span>}
        </div>
        <ul className="space-y-4 mb-8 flex-1">
            {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-300 text-sm">
                    <CheckCircle2 size={18} className="text-indigo-400 shrink-0 mt-0.5" /> {f}
                </li>
            ))}
        </ul>
        <Link to={link} className={`w-full py-3 rounded-xl font-bold text-center transition ${highlighted ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-[#0f172a] hover:bg-gray-800 text-white border border-gray-600'}`}>
            {buttonText}
        </Link>
    </div>
);

export default Home;