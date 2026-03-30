import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import {
    CheckCircle2, Clock, AlertCircle, Calendar,
    ChevronRight, Loader2, Play, AlertTriangle, Target
} from 'lucide-react';

const MyWork = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const { showToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Active');

    useEffect(() => {
        fetchMyTasks();
    }, []);

    const fetchMyTasks = async () => {
        try {
            const { data } = await api.get('/task/user/me?limit=1000');
            setTasks(data.data || []);
        } catch (error) {
            console.error(error);
            showToast("Failed to load your tasks", "error");
        } finally {
            setLoading(false);
        }
    };

    const groupTasks = () => {
        const groups = { overdue: [], today: [], upcoming: [], later: [] };
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));
        const nextWeek = new Date(todayEnd);
        nextWeek.setDate(nextWeek.getDate() + 7);

        const visibleTasks = filter === 'Active'
            ? tasks.filter(t => t.status !== 'Merged' && t.status !== 'Completed')
            : tasks;

        visibleTasks.forEach(task => {
            if (!task.deadline) {
                groups.later.push(task);
                return;
            }
            const deadline = new Date(task.deadline);
            if (deadline < todayStart && task.status !== 'Merged') {
                groups.overdue.push(task);
            } else if (deadline >= todayStart && deadline <= todayEnd) {
                groups.today.push(task);
            } else if (deadline > todayEnd && deadline <= nextWeek) {
                groups.upcoming.push(task);
            } else {
                groups.later.push(task);
            }
        });

        const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const sortByPriority = (a, b) => priorityWeight[b.priority] - priorityWeight[a.priority];

        groups.overdue.sort(sortByPriority);
        groups.today.sort(sortByPriority);
        groups.upcoming.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        groups.later.sort(sortByPriority);

        return groups;
    };

    const groupedTasks = groupTasks();
    const totalActiveCount = groupedTasks.overdue.length + groupedTasks.today.length + groupedTasks.upcoming.length + groupedTasks.later.length;

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0f172a] text-white">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                <p className="text-gray-400">Loading your daily focus...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">
            {/* Header */}
            <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800 bg-[#0f172a] sticky top-0 z-10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Duplicate Mobile Menu Button Removed Here */}
                    <div>
                        <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                            <Target className="text-indigo-500" size={20} />
                            My Work
                        </h1>
                        <p className="text-xs text-gray-500 mt-1 hidden sm:block">Your daily focus across all active workspaces.</p>
                    </div>
                </div>

                <div className="flex bg-[#1e293b] p-1 rounded-lg border border-gray-700 w-full sm:w-auto">
                    <button
                        onClick={() => setFilter('Active')}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md transition ${filter === 'Active' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        Active ({filter === 'Active' ? totalActiveCount : tasks.filter(t => t.status !== 'Merged' && t.status !== 'Completed').length})
                    </button>
                    <button
                        onClick={() => setFilter('All')}
                        className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold rounded-md transition ${filter === 'All' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        All Tasks
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-700 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">
                {groupedTasks.overdue.length > 0 && (
                    <TaskGroup title="Overdue" icon={<AlertTriangle size={16} className="text-rose-500" />} tasks={groupedTasks.overdue} borderColor="border-rose-500/30" headerColor="text-rose-400" />
                )}
                {groupedTasks.today.length > 0 && (
                    <TaskGroup title="Due Today" icon={<AlertCircle size={16} className="text-amber-500" />} tasks={groupedTasks.today} borderColor="border-amber-500/30" headerColor="text-amber-400" defaultOpen={true} />
                )}
                {groupedTasks.upcoming.length > 0 && (
                    <TaskGroup title="Upcoming" icon={<Calendar size={16} className="text-blue-400" />} tasks={groupedTasks.upcoming} borderColor="border-blue-500/20" headerColor="text-blue-400" defaultOpen={groupedTasks.today.length === 0} />
                )}
                {groupedTasks.later.length > 0 && (
                    <TaskGroup title="Later / No Deadline" icon={<Clock size={16} className="text-gray-400" />} tasks={groupedTasks.later} borderColor="border-gray-700" headerColor="text-gray-300" />
                )}
            </main>
        </div>
    );
};

const TaskGroup = ({ title, icon, tasks, borderColor, headerColor, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`bg-[#1e293b] rounded-xl border ${borderColor} overflow-hidden shadow-sm transition-all`}>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between bg-black/10 hover:bg-black/20 transition-colors">
                <div className="flex items-center gap-2 sm:gap-3">
                    {icon}
                    <h2 className={`font-bold text-sm sm:text-lg ${headerColor}`}>{title}</h2>
                    <span className="bg-[#0f172a] px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold text-gray-400 border border-gray-700">
                        {tasks.length}
                    </span>
                </div>
                <ChevronRight size={18} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {isOpen && (
                <div className="divide-y divide-gray-800">
                    {tasks.map(task => (
                        <Link key={task._id} to={`/task/${task._id}/work`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 hover:bg-[#0f172a]/50 transition group gap-2 sm:gap-4">
                            <div className="flex items-start gap-3 w-full sm:w-auto overflow-hidden">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.priority === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : task.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-sm sm:text-base text-white font-medium group-hover:text-indigo-400 transition truncate">{task.title}</h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] sm:text-xs text-gray-500">
                                        <span className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700 text-gray-300 truncate max-w-[120px] sm:max-w-xs">
                                            {task.project?.title || 'Unknown Project'}
                                        </span>
                                        {task.deadline && (
                                            <span className="flex items-center gap-1 shrink-0">
                                                <Calendar size={10} /> {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto sm:ml-auto pl-5 sm:pl-0 mt-2 sm:mt-0">
                                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold uppercase tracking-wider border whitespace-nowrap ${task.status === 'Merged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                    task.status === 'Review-Requested' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                        task.status === 'In-Progress' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                            'bg-gray-800 text-gray-400 border-gray-600'
                                    }`}>
                                    {task.status.replace('-', ' ')}
                                </span>
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0 border border-indigo-500/30">
                                    <Play size={12} className="ml-0.5" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyWork;