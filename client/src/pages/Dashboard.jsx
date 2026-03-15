import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import {
    Plus, Folder, Clock, Menu,
    MoreVertical, ArrowRight, Activity, Check, X,
    Layout, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import NotificationBell from '../components/NotificationBell';
import RecentlyViewed from '../components/dashboard/RecentlyViewed';

// --- NEW IMPORTS FOR CHARTS ---
import OverallProgress from '../components/dashboard/OverallProgress';
import WorkloadStatus from '../components/dashboard/WorkloadStatus';

const Dashboard = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    // State
    const [projects, setProjects] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // FIX: Changed 'name' to 'title' to match backend expectation
    const [newProject, setNewProject] = useState({ title: '', description: '', aiApiKey: '' });

    // --- FILTERING LOGIC ---
    const pendingInvites = projects.filter(p => {
        if (p.owner._id === user?._id) return false;
        const membership = p.members.find(m => m.user?._id === user?._id);
        return membership?.status === 'Pending';
    });

    const activeProjects = projects.filter(p => {
        if (p.owner._id === user?._id) return true;
        const membership = p.members.find(m => m.user?._id === user?._id);
        return membership?.status === 'Active';
    });

    // --- DATA FETCHING ---
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [projectsRes, tasksRes] = await Promise.all([
                api.get('/projects?limit=1000'),
                api.get('/task/user/me?limit=10000')
            ]);
            setProjects(projectsRes.data?.data || []);
            setMyTasks(tasksRes.data?.data || []);
        } catch (err) {
            console.error("Error fetching data:", err);
            showToast("Failed to load dashboard data", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---
    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projects', newProject);
            setShowModal(false);
            setNewProject({ title: '', description: '', aiApiKey: '' });
            showToast("Workspace created successfully!", "success");
            // FIX: Instantly refetch all data so the new project is populated properly
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to create project", "error");
        }
    };

    const handleAcceptInvite = async (projectId) => {
        try {
            await api.patch(`/projects/${projectId}/accept`);
            fetchData();
            showToast("Invitation accepted! Welcome to the workspace.", "success");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to accept invite", "error");
        }
    };

    const handleDeclineInvite = async (projectId) => {
        if (!confirm("Are you sure you want to decline this invitation?")) return;
        try {
            await api.delete(`/projects/${projectId}/leave`);
            fetchData();
            showToast("Invitation declined", "info");
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to decline", "error");
        }
    };

    // --- STATS CALCULATION ---
    const stats = {
        activeProjects: activeProjects.length,
        pendingTasks: myTasks.filter(t => t.status !== 'Merged').length,
        completedTasks: myTasks.filter(t => t.status === 'Merged').length,
        teamLoad: myTasks.length > 0
            ? Math.round((myTasks.filter(t => t.status === 'In-Progress').length / myTasks.length) * 100)
            : 0
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading Dashboard...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">

            {/* HEADER */}
            <header className="h-20 border-b border-gray-800 bg-[#0f172a]/95 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {!isSidebarOpen && (
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-[#1e293b] text-white rounded-lg hover:bg-indigo-600 transition">
                            <Menu size={20} />
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-white">Dashboard</h1>
                </div>
                <div className="flex items-center gap-6">
                    <NotificationBell />
                    <button onClick={() => setShowModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg shadow-indigo-900/20 transition">
                        <Plus size={18} /> <span className="hidden sm:inline">New Project</span>
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="p-6 space-y-8 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">

                {/* --- PENDING INVITATIONS --- */}
                {pendingInvites.length > 0 && (
                    <div className="animate-in slide-in-from-top-4 duration-500">
                        <h2 className="text-lg font-bold text-white mb-4">Pending Invitations</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {pendingInvites.map(project => (
                                <div key={project._id} className="bg-[#1e293b] p-5 rounded-xl border border-indigo-500/30">
                                    <h3 className="text-white font-bold">{project.name || project.title}</h3>
                                    <p className="text-xs text-gray-400">Invited by {project.owner?.name}</p>
                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => handleAcceptInvite(project._id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold transition">Accept</button>
                                        <button onClick={() => handleDeclineInvite(project._id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-xs font-bold transition">Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- STATS CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="Total Projects" value={stats.activeProjects} icon={<Layout size={24} />} color="text-blue-400" bg="bg-blue-500/10" />
                    <StatCard label="Pending Tasks" value={stats.pendingTasks} icon={<Clock size={24} />} color="text-amber-400" bg="bg-amber-500/10" />
                    <StatCard label="Completed" value={stats.completedTasks} icon={<CheckCircle2 size={24} />} color="text-emerald-400" bg="bg-emerald-500/10" />
                    <StatCard label="Team Load" value={`${stats.teamLoad}%`} icon={<Activity size={24} />} color="text-indigo-400" bg="bg-indigo-500/10" />
                </div>

                {/* --- RECENTLY VIEWED --- */}
                <RecentlyViewed />

                {/* --- ANALYTICS CHARTS ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <OverallProgress />
                    </div>
                    <div className="lg:col-span-2 flex flex-col">
                        <div className="flex-1">
                            <WorkloadStatus tasks={myTasks} />
                        </div>
                    </div>
                </div>

                {/* --- ACTIVE WORKSPACES & TASKS --- */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column: Projects List */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-white">Your Workspaces</h2>
                            <Link to="/my-projects" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                View All <ArrowRight size={16} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {/* 1. CREATE WORKSPACE CARD */}
                            <button
                                onClick={() => setShowModal(true)}
                                className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 p-6 rounded-xl border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-600/30 transition flex flex-col items-center justify-center text-white gap-3 min-h-[180px] group animate-in fade-in zoom-in duration-300"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition">
                                    <Plus size={24} className="text-indigo-400" />
                                </div>
                                <div className="text-center">
                                    <span className="font-bold block">Create Workspace</span>
                                    <span className="text-xs text-gray-400">Start a new project</span>
                                </div>
                            </button>

                            {/* 2. Existing Projects (FIX: .slice(0, 3) restricts to only 3 items) */}
                            {activeProjects.slice(0, 3).map((project) => (
                                <Link
                                    key={project._id}
                                    to={`/project/${project._id}`}
                                    className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 hover:border-indigo-500/50 hover:shadow-lg transition group relative overflow-hidden flex flex-col justify-between h-[180px]"
                                >
                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg group-hover:bg-indigo-500 group-hover:text-white transition">
                                                {(project.name || project.title || 'U').charAt(0)}
                                            </div>
                                            <span className={`text-[10px] px-2 py-1 rounded-full border ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                }`}>
                                                {project.status || 'Active'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-1 truncate group-hover:text-indigo-400 transition">
                                            {project.name || project.title}
                                        </h3>
                                        <p className="text-gray-400 text-sm line-clamp-2">
                                            {project.description || "No description provided."}
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                                        <Clock size={12} /> Updated {new Date(project.updatedAt).toLocaleDateString()}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: My Tasks List */}
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 h-fit flex flex-col max-h-[600px]">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center shrink-0">
                            <h2 className="text-lg font-bold text-white">My Priorities</h2>
                            <Link to="/kanban" className="text-xs text-indigo-400 hover:underline">View Kanban</Link>
                        </div>
                        <div className="p-2 overflow-y-auto custom-scrollbar">
                            {myTasks.length > 0 ? (
                                myTasks.slice(0, 8).map(task => {
                                    const isReviewing = task.status === 'Review-Requested';
                                    const isMerged = task.status === 'Merged';

                                    return (
                                        <Link
                                            key={task._id}
                                            to={`/task/${task._id}/work`}
                                            className={`p-3 rounded-lg hover:bg-gray-700/50 transition flex items-start gap-3 group cursor-pointer border-b border-gray-800/50 last:border-0 ${isReviewing ? 'bg-emerald-900/10 border-l-2 border-l-emerald-500' : ''}`}
                                        >
                                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${task.priority === 'High' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-gray-200 truncate group-hover:text-indigo-400 transition">{task.title}</h4>
                                                <p className="text-[10px] text-gray-500 truncate">{task.project?.name || task.project?.title || 'Unknown Project'}</p>
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded border whitespace-nowrap ${isMerged ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                isReviewing ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-gray-700/50 text-gray-400 border-gray-600'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                                    <CheckCircle2 size={32} className="mb-2 opacity-50" />
                                    <p>No pending tasks.</p>
                                    <p className="text-xs">You're all caught up!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* CREATE PROJECT MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Create Workspace</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">Workspace Name *</label>
                                <input
                                    className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none transition"
                                    value={newProject.title}
                                    onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                                    placeholder="e.g. AI Research Platform"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">Description</label>
                                <textarea
                                    className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-white h-24 focus:border-indigo-500 focus:outline-none resize-none transition"
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="What is this workspace for?"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">Gemini API Key <span className="text-xs text-gray-500">(Optional)</span></label>
                                <input
                                    type="password"
                                    className="w-full p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-white focus:border-indigo-500 focus:outline-none transition"
                                    value={newProject.aiApiKey}
                                    onChange={e => setNewProject({ ...newProject, aiApiKey: e.target.value })}
                                    placeholder="sk-..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Required for AI task analysis features.</p>
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700/50">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-400 hover:text-white transition font-medium">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-lg shadow-indigo-900/20">Create Workspace</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// StatCard Component
const StatCard = ({ label, value, icon, color, bg }) => (
    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 flex items-center gap-4 hover:border-gray-600 transition group">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bg} ${color} group-hover:scale-110 transition`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

export default Dashboard;