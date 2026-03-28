import { useState, useEffect, useMemo } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { Users, Battery, BatteryMedium, BatteryCharging, ArrowRightLeft, Loader2, Search, X } from 'lucide-react';

const ResourcePlanning = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [teamMembers, setTeamMembers] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const [showReassignModal, setShowReassignModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newAssignee, setNewAssignee] = useState('');
    const [isReassigning, setIsReassigning] = useState(false);

    useEffect(() => { fetchWorkloadData(); }, []);

    const fetchWorkloadData = async () => {
        try {
            const { data: projectData } = await api.get('/projects?limit=100');
            const projects = projectData.data || [];

            const memberMap = new Map();
            projects.forEach(p => {
                p.members.forEach(m => {
                    if (m.user && m.status === 'Active') memberMap.set(m.user._id, m.user);
                });
                if (p.owner) memberMap.set(p.owner._id, p.owner);
            });

            const taskPromises = projects.map(p => api.get(`/task/project/${p._id}?limit=1000`));
            const taskResponses = await Promise.all(taskPromises);
            const aggregatedTasks = taskResponses.flatMap(res => res.data.data || []);

            setTeamMembers(Array.from(memberMap.values()));
            setAllTasks(aggregatedTasks);
        } catch (error) {
            console.error(error);
            showToast("Failed to load resource data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReassign = async (e) => {
        e.preventDefault();
        if (!selectedTask || !newAssignee) return;
        setIsReassigning(true);
        try {
            const { data } = await api.put(`/task/${selectedTask._id}`, { assignedTo: newAssignee });
            setAllTasks(prev => prev.map(t => t._id === selectedTask._id ? data.data : t));
            showToast("Task reassigned successfully", "success");
            setShowReassignModal(false);
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to reassign task", "error");
        } finally {
            setIsReassigning(false);
        }
    };

    const openReassignModal = (task) => {
        setSelectedTask(task);
        setNewAssignee(task.assignedTo?._id || '');
        setShowReassignModal(true);
    };

    const workloadData = useMemo(() => {
        return teamMembers.map(member => {
            const memberTasks = allTasks.filter(t => t.assignedTo?._id === member._id && t.status !== 'Merged');
            const todo = memberTasks.filter(t => t.status === 'To-Do').length;
            const inProgress = memberTasks.filter(t => t.status === 'In-Progress').length;
            const review = memberTasks.filter(t => t.status === 'Review-Requested').length;
            const totalActive = memberTasks.length;

            let health = 'Available';
            if (totalActive > 6 || inProgress > 3) health = 'Overloaded';
            else if (totalActive >= 3) health = 'Optimal';

            return { ...member, tasks: memberTasks, todo, inProgress, review, totalActive, health };
        }).filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a, b) => b.totalActive - a.totalActive);
    }, [teamMembers, allTasks, searchQuery]);

    const stats = {
        totalMembers: teamMembers.length,
        overloaded: workloadData.filter(m => m.health === 'Overloaded').length,
        optimal: workloadData.filter(m => m.health === 'Optimal').length,
        available: workloadData.filter(m => m.health === 'Available').length,
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0f172a] text-white">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                <p className="text-gray-400 text-sm">Analyzing team workload across all projects...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">
            <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800 bg-[#0f172a] sticky top-0 z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Users className="text-indigo-500" size={20} /> Resource Allocation
                    </h1>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Monitor bandwidth and rebalance workloads.</p>
                </div>
                <div className="relative w-full sm:w-64 shrink-0">
                    <Search className="absolute left-3 top-2 text-gray-500" size={14} />
                    <input
                        type="text"
                        placeholder="Search team members..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#1e293b] border border-gray-700 rounded-lg py-1.5 sm:py-2 pl-8 pr-3 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 text-white transition"
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-700 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-[#1e293b] p-3 sm:p-5 rounded-xl border border-gray-700 flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center"><Users size={18} /></div>
                        <div><p className="text-[10px] sm:text-xs text-gray-400">Total Tracked</p><p className="text-lg sm:text-2xl font-bold text-white">{stats.totalMembers}</p></div>
                    </div>
                    <div className="bg-[#1e293b] p-3 sm:p-5 rounded-xl border border-rose-500/30 flex items-center gap-3 sm:gap-4 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center"><Battery size={18} /></div>
                        <div><p className="text-[10px] sm:text-xs text-gray-400">Overloaded</p><p className="text-lg sm:text-2xl font-bold text-white">{stats.overloaded}</p></div>
                    </div>
                    <div className="bg-[#1e293b] p-3 sm:p-5 rounded-xl border border-emerald-500/30 flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center"><BatteryMedium size={18} /></div>
                        <div><p className="text-[10px] sm:text-xs text-gray-400">Optimal Load</p><p className="text-lg sm:text-2xl font-bold text-white">{stats.optimal}</p></div>
                    </div>
                    <div className="bg-[#1e293b] p-3 sm:p-5 rounded-xl border border-gray-700 flex items-center gap-3 sm:gap-4">
                        <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-gray-700/50 text-gray-400 flex items-center justify-center"><BatteryCharging size={18} /></div>
                        <div><p className="text-[10px] sm:text-xs text-gray-400">Available</p><p className="text-lg sm:text-2xl font-bold text-white">{stats.available}</p></div>
                    </div>
                </div>

                <div className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-gray-800/80 border-b border-gray-700 text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">
                                    <th className="p-3 sm:p-4 font-medium">Team Member</th>
                                    <th className="p-3 sm:p-4 font-medium text-center">Active Load</th>
                                    <th className="p-3 sm:p-4 font-medium text-center">In Progress</th>
                                    <th className="p-3 sm:p-4 font-medium text-center">To-Do / Review</th>
                                    <th className="p-3 sm:p-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50 text-xs sm:text-sm">
                                {workloadData.map(member => (
                                    <tr key={member._id} className="hover:bg-[#0f172a]/50 transition group">
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold overflow-hidden shrink-0">
                                                    {member.avatar ? <img src={member.avatar} alt="avatar" className="w-full h-full object-cover" /> : member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-200">{member.name} {member._id === user._id && "(You)"}</p>
                                                    <p className="text-[10px] sm:text-xs text-gray-500">{member.email}</p>
                                                </div>
                                            </div>

                                            {member.totalActive > 0 && (
                                                <div className="mt-3 hidden group-hover:block space-y-2 pl-11 animate-in fade-in slide-in-from-top-2 duration-200">
                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Current Assignments:</p>
                                                    {member.tasks.map(task => (
                                                        <div key={task._id} className="flex items-center justify-between bg-[#0f172a] p-2 rounded border border-gray-700 text-[10px] sm:text-xs">
                                                            <div className="truncate pr-2 sm:pr-4 flex-1">
                                                                <span className="text-white">{task.title}</span>
                                                                <span className="text-gray-500 ml-1 sm:ml-2 truncate max-w-[80px] sm:max-w-none inline-block align-bottom">{task.project?.title || 'Unknown'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                                                <span className={`px-1.5 py-0.5 rounded border ${task.status === 'In-Progress' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
                                                                    {task.status}
                                                                </span>
                                                                <button onClick={() => openReassignModal(task)} className="p-1 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition" title="Reassign">
                                                                    <ArrowRightLeft size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-3 sm:p-4 text-center"><span className="text-base sm:text-lg font-bold text-white">{member.totalActive}</span></td>
                                        <td className="p-3 sm:p-4 text-center"><span className="text-cyan-400 font-medium">{member.inProgress}</span></td>
                                        <td className="p-3 sm:p-4 text-center text-gray-400">{member.todo} / {member.review}</td>
                                        <td className="p-3 sm:p-4">
                                            <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border ${member.health === 'Overloaded' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : member.health === 'Optimal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-800 text-gray-400 border-gray-600'}`}>
                                                {member.health}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {workloadData.length === 0 && (
                                    <tr><td colSpan="5" className="p-6 text-center text-gray-500 text-sm">No team members found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {showReassignModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-5 sm:p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-5 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <ArrowRightLeft className="text-indigo-500" size={18} /> Reassign Task
                            </h3>
                            <button onClick={() => setShowReassignModal(false)} className="text-gray-400 hover:text-white transition"><X size={18} /></button>
                        </div>
                        <div className="mb-5 bg-[#0f172a] p-3 sm:p-4 rounded-lg border border-gray-700">
                            <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Task Title</p>
                            <p className="text-xs sm:text-sm font-medium text-white mb-2 sm:mb-3">{selectedTask?.title}</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mb-1">Current Assignee</p>
                            <p className="text-xs sm:text-sm text-gray-300">{selectedTask?.assignedTo?.name || 'Unassigned'}</p>
                        </div>
                        <form onSubmit={handleReassign}>
                            <label className="text-xs sm:text-sm font-medium text-gray-400 mb-2 block">Select New Assignee</label>
                            <select className="w-full p-2.5 sm:p-3 bg-[#0f172a] border border-gray-600 rounded-lg text-xs sm:text-sm text-white focus:border-indigo-500 outline-none transition mb-5" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} required>
                                <option value="" disabled>Choose team member...</option>
                                {teamMembers.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                            </select>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                                <button type="button" onClick={() => setShowReassignModal(false)} className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition font-medium">Cancel</button>
                                <button type="submit" disabled={isReassigning || !newAssignee || newAssignee === selectedTask?.assignedTo?._id} className="px-4 sm:px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2">
                                    {isReassigning ? <Loader2 size={14} className="animate-spin" /> : null} Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourcePlanning;