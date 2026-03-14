import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { Clock, Calendar, Check, X, Loader2, PlayCircle, Filter } from 'lucide-react';

const Timesheet = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('my-time'); // 'my-time' or 'approvals'
    const [loading, setLoading] = useState(true);

    // State
    const [myLogs, setMyLogs] = useState([]);
    const [teamLogs, setTeamLogs] = useState([]);
    const [myTasks, setMyTasks] = useState([]);

    // New Log Form
    const [newLog, setNewLog] = useState({ taskId: '', date: new Date().toISOString().split('T')[0], hours: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'my-time') {
                const [logsRes, tasksRes] = await Promise.all([
                    api.get('/timelogs/me'),
                    api.get('/task/user/me?limit=100') // Fetch tasks to log time against
                ]);
                setMyLogs(logsRes.data.data);
                setMyTasks(tasksRes.data.data);
            } else {
                // Fetch projects user manages, then fetch logs for those projects
                const { data: projData } = await api.get('/projects');
                const managedProjects = projData.data.filter(p => p.owner === user._id || p.owner._id === user._id);

                let allTeamLogs = [];
                for (const p of managedProjects) {
                    try {
                        const { data: logsData } = await api.get(`/timelogs/project/${p._id}`);
                        allTeamLogs = [...allTeamLogs, ...logsData.data];
                    } catch (e) { console.warn("Not a manager of", p._id); }
                }
                setTeamLogs(allTeamLogs);
            }
        } catch (error) {
            showToast("Failed to load timesheet data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogTime = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/timelogs', newLog);
            setMyLogs([data.data, ...myLogs]);
            setNewLog({ ...newLog, hours: '', description: '' });
            showToast("Time logged successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to log time", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApproval = async (logId, status) => {
        try {
            await api.patch(`/timelogs/${logId}/status`, { status });
            setTeamLogs(teamLogs.map(log => log._id === logId ? { ...log, status } : log));
            showToast(`Time entry ${status.toLowerCase()}`, "success");
        } catch (error) {
            showToast("Failed to update status", "error");
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">
            <header className="px-6 py-5 border-b border-gray-800 bg-[#0f172a] sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="text-indigo-500" size={24} /> Timesheets & Tracking
                    </h1>
                </div>
                <div className="flex bg-[#1e293b] p-1 rounded-lg border border-gray-700 w-fit">
                    <button onClick={() => setActiveTab('my-time')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${activeTab === 'my-time' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                        My Timesheet
                    </button>
                    <button onClick={() => setActiveTab('approvals')} className={`px-4 py-1.5 text-sm font-bold rounded-md transition ${activeTab === 'approvals' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                        Team Approvals
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 max-w-6xl mx-auto w-full">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>
                ) : activeTab === 'my-time' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Log Time Form */}
                        <div className="lg:col-span-1 bg-[#1e293b] p-6 rounded-xl border border-gray-700 h-fit sticky top-6">
                            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <PlayCircle size={18} className="text-emerald-400" /> Log Hours
                            </h2>
                            <form onSubmit={handleLogTime} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Task</label>
                                    <select required value={newLog.taskId} onChange={e => setNewLog({ ...newLog, taskId: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500">
                                        <option value="">Select a task...</option>
                                        {myTasks.filter(t => t.status !== 'Merged').map(t => (
                                            <option key={t._id} value={t._id}>{t.title} ({t.project?.title})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Date</label>
                                        <input type="date" required value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Hours</label>
                                        <input type="number" step="0.5" min="0.5" max="24" required value={newLog.hours} onChange={e => setNewLog({ ...newLog, hours: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500" placeholder="e.g. 2.5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">What did you work on?</label>
                                    <textarea required value={newLog.description} onChange={e => setNewLog({ ...newLog, description: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 text-sm text-white focus:border-indigo-500 h-20 resize-none" placeholder="Brief description..."></textarea>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Timesheet'}
                                </button>
                            </form>
                        </div>

                        {/* History */}
                        <div className="lg:col-span-2 space-y-4">
                            <h2 className="text-lg font-bold text-white mb-4">My Logged Time</h2>
                            {myLogs.length === 0 ? (
                                <p className="text-gray-500 py-10 text-center">No time logged yet.</p>
                            ) : (
                                myLogs.map(log => (
                                    <div key={log._id} className="bg-[#1e293b] p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row gap-4 justify-between">
                                        <div>
                                            <h3 className="text-white font-medium">{log.task?.title || 'Unknown Task'}</h3>
                                            <p className="text-sm text-gray-400 mt-1">{log.description}</p>
                                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(log.date).toLocaleDateString()}</span>
                                                <span className="bg-[#0f172a] px-2 py-0.5 rounded border border-gray-700">{log.project?.title}</span>
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                                            <span className="text-xl font-bold text-indigo-400">{log.hours} <span className="text-xs text-gray-500 font-normal">hrs</span></span>
                                            <StatusBadge status={log.status} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-6">
                            <h2 className="text-lg font-bold text-white">Pending Team Approvals</h2>
                        </div>
                        {teamLogs.filter(l => l.status === 'Pending').length === 0 ? (
                            <div className="py-20 text-center bg-[#1e293b] rounded-xl border border-gray-700">
                                <Check size={48} className="mx-auto mb-4 text-emerald-500 opacity-50" />
                                <p className="text-gray-400">All timesheets are approved!</p>
                            </div>
                        ) : (
                            teamLogs.filter(l => l.status === 'Pending').map(log => (
                                <div key={log._id} className="bg-[#1e293b] p-5 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row gap-4 justify-between shadow-lg">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                                            {log.user?.avatar ? <img src={log.user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-indigo-400 font-bold">{log.user?.name?.charAt(0)}</span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{log.user?.name} <span className="text-gray-500 font-normal ml-2">logged {log.hours} hrs</span></p>
                                            <p className="text-sm text-indigo-400 font-medium mt-1">{log.task?.title}</p>
                                            <p className="text-sm text-gray-400 italic mt-1">"{log.description}"</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-gray-700 pt-3 sm:pt-0 mt-3 sm:mt-0">
                                        <button onClick={() => handleApproval(log._id, 'Approved')} className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition">
                                            <Check size={16} /> Approve
                                        </button>
                                        <button onClick={() => handleApproval(log._id, 'Rejected')} className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-rose-600 hover:text-white text-gray-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border border-gray-700 transition">
                                            <X size={16} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const colors = {
        Pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        Approved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        Rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    };
    return (
        <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-bold mt-2 ${colors[status]}`}>
            {status}
        </span>
    );
};

export default Timesheet;