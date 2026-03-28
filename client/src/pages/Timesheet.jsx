import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { Clock, Calendar, Check, X, Loader2, PlayCircle } from 'lucide-react';

const Timesheet = () => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState('my-time');
    const [loading, setLoading] = useState(true);

    const [myLogs, setMyLogs] = useState([]);
    const [teamLogs, setTeamLogs] = useState([]);
    const [myTasks, setMyTasks] = useState([]);

    const [newLog, setNewLog] = useState({ taskId: '', date: new Date().toISOString().split('T')[0], hours: '', description: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchData(); }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'my-time') {
                const [logsRes, tasksRes] = await Promise.all([api.get('/timelogs/me'), api.get('/task/user/me?limit=100')]);
                setMyLogs(logsRes.data.data);
                setMyTasks(tasksRes.data.data);
            } else {
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
            <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800 bg-[#0f172a] sticky top-0 z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Clock className="text-indigo-500" size={20} /> Timesheets & Tracking
                    </h1>
                    <div className="flex bg-[#1e293b] p-1 rounded-lg border border-gray-700 w-full sm:w-fit">
                        <button onClick={() => setActiveTab('my-time')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md transition ${activeTab === 'my-time' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                            My Timesheet
                        </button>
                        <button onClick={() => setActiveTab('approvals')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md transition ${activeTab === 'approvals' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                            Team Approvals
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-700 max-w-6xl mx-auto w-full">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>
                ) : activeTab === 'my-time' ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        <div className="lg:col-span-1 bg-[#1e293b] p-4 sm:p-6 rounded-xl border border-gray-700 h-fit lg:sticky top-6">
                            <h2 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <PlayCircle size={18} className="text-emerald-400" /> Log Hours
                            </h2>
                            <form onSubmit={handleLogTime} className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">Task</label>
                                    <select required value={newLog.taskId} onChange={e => setNewLog({ ...newLog, taskId: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none">
                                        <option value="">Select a task...</option>
                                        {myTasks.filter(t => t.status !== 'Merged').map(t => (
                                            <option key={t._id} value={t._id}>{t.title} ({t.project?.title})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Date</label>
                                        <input type="date" required value={newLog.date} onChange={e => setNewLog({ ...newLog, date: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block">Hours</label>
                                        <input type="number" step="0.5" min="0.5" max="24" required value={newLog.hours} onChange={e => setNewLog({ ...newLog, hours: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none" placeholder="e.g. 2.5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block">What did you work on?</label>
                                    <textarea required value={newLog.description} onChange={e => setNewLog({ ...newLog, description: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 h-20 resize-none outline-none" placeholder="Brief description..."></textarea>
                                </div>
                                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-bold transition flex items-center justify-center gap-2">
                                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Timesheet'}
                                </button>
                            </form>
                        </div>

                        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
                            <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-4">My Logged Time</h2>
                            {myLogs.length === 0 ? (
                                <p className="text-gray-500 py-10 text-center text-sm">No time logged yet.</p>
                            ) : (
                                myLogs.map(log => (
                                    <div key={log._id} className="bg-[#1e293b] p-3 sm:p-4 rounded-xl border border-gray-700 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-sm sm:text-base text-white font-medium truncate">{log.task?.title || 'Unknown Task'}</h3>
                                            <p className="text-xs sm:text-sm text-gray-400 mt-0.5 line-clamp-2">{log.description}</p>
                                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] sm:text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(log.date).toLocaleDateString()}</span>
                                                <span className="bg-[#0f172a] px-1.5 py-0.5 rounded border border-gray-700 truncate max-w-[150px]">{log.project?.title}</span>
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-gray-700 pt-2 sm:pt-0">
                                            <span className="text-lg sm:text-xl font-bold text-indigo-400">{log.hours} <span className="text-[10px] sm:text-xs text-gray-500 font-normal">hrs</span></span>
                                            <StatusBadge status={log.status} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 sm:space-y-4">
                        <h2 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-4">Pending Team Approvals</h2>
                        {teamLogs.filter(l => l.status === 'Pending').length === 0 ? (
                            <div className="py-16 text-center bg-[#1e293b] rounded-xl border border-gray-700">
                                <Check size={36} className="mx-auto mb-3 text-emerald-500 opacity-50" />
                                <p className="text-sm text-gray-400">All timesheets are approved!</p>
                            </div>
                        ) : (
                            teamLogs.filter(l => l.status === 'Pending').map(log => (
                                <div key={log._id} className="bg-[#1e293b] p-4 sm:p-5 rounded-xl border border-amber-500/30 flex flex-col sm:flex-row gap-4 justify-between shadow-lg">
                                    <div className="flex gap-3 sm:gap-4 min-w-0">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                                            {log.user?.avatar ? <img src={log.user.avatar} alt="" className="w-full h-full object-cover" /> : <span className="text-indigo-400 font-bold">{log.user?.name?.charAt(0)}</span>}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs sm:text-sm font-bold text-white truncate">{log.user?.name} <span className="text-gray-500 font-normal ml-1">logged {log.hours} hrs</span></p>
                                            <p className="text-[10px] sm:text-sm text-indigo-400 font-medium mt-0.5 truncate">{log.task?.title}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-400 italic mt-1 line-clamp-2">"{log.description}"</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 border-gray-700 pt-3 sm:pt-0">
                                        <button onClick={() => handleApproval(log._id, 'Approved')} className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition">
                                            <Check size={14} /> Approve
                                        </button>
                                        <button onClick={() => handleApproval(log._id, 'Rejected')} className="flex-1 sm:flex-none px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 hover:bg-rose-600 hover:text-white text-gray-400 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 border border-gray-700 transition">
                                            <X size={14} /> Reject
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
        <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded border uppercase tracking-wider font-bold ${colors[status]}`}>
            {status}
        </span>
    );
};

export default Timesheet;