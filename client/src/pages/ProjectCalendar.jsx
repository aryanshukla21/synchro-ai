import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Kanban as KanbanIcon, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext'; // <-- NEW: Real-time data
import TaskDetailPanel from '../components/kanban/TaskDetailPanel';

const ProjectCalendar = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { socket } = useSocket(); // <-- NEW: Hook into global sockets

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    // 1. Initial Data Fetch
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const { data } = await api.get(`/task/project/${projectId}?limit=1000`);
                setTasks(data.data || []);
            } catch (error) {
                showToast('Failed to load calendar tasks', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    }, [projectId, showToast]);

    // 2. NEW: Real-Time Socket Listeners for the Calendar
    useEffect(() => {
        if (!socket || !projectId) return;

        socket.emit('joinProject', projectId);

        const handleTaskUpdated = (updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
            setSelectedTask(prev => prev && prev._id === updatedTask._id ? updatedTask : prev);
        };

        const handleTaskCreated = (newTask) => {
            setTasks(prev => [...prev, newTask]);
        };

        const handleTaskDeleted = (deletedTaskId) => {
            setTasks(prev => prev.filter(t => t._id !== deletedTaskId));
            setSelectedTask(prev => prev && prev._id === deletedTaskId ? null : prev);
        };

        socket.on('task-updated', handleTaskUpdated);
        socket.on('task-created', handleTaskCreated);
        socket.on('task-deleted', handleTaskDeleted);

        return () => {
            socket.emit('leaveProject', projectId);
            socket.off('task-updated', handleTaskUpdated);
            socket.off('task-created', handleTaskCreated);
            socket.off('task-deleted', handleTaskDeleted);
        };
    }, [socket, projectId]);

    // --- Calendar Math Logic ---
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();

    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const getTasksForDay = (day) => {
        return tasks.filter(task => {
            if (!task.deadline) return false;
            const taskDate = new Date(task.deadline);
            return (
                taskDate.getDate() === day &&
                taskDate.getMonth() === currentMonth &&
                taskDate.getFullYear() === currentYear
            );
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Merged': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30';
            case 'Review-Requested': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30';
            case 'In-Progress': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/30';
            default: return 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600';
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-white">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-gray-400">Plotting tasks on calendar...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh)] bg-[#0f172a] text-gray-300 relative overflow-hidden">

            {/* NEW: Unified Header with View Switcher */}
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#0f172a] flex-shrink-0 animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="text-indigo-500" size={24} /> Project Timeline
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    {/* View Switcher (Board vs Calendar) */}
                    <div className="bg-[#1e293b] p-1 rounded-lg border border-gray-700 flex items-center">
                        <Link
                            to={`/project/${projectId}`}
                            className="px-4 py-1.5 text-sm font-bold text-gray-400 hover:text-white rounded-md transition flex items-center gap-2"
                        >
                            <KanbanIcon size={16} /> Board
                        </Link>
                        <div className="px-4 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-md shadow flex items-center gap-2 pointer-events-none">
                            <CalendarIcon size={16} /> Calendar
                        </div>
                    </div>

                    {/* Month Controls */}
                    <div className="flex items-center gap-2 bg-[#1e293b] p-1.5 rounded-xl border border-gray-700">
                        <button onClick={prevMonth} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                            <ChevronLeft size={18} />
                        </button>
                        <div className="w-36 text-center font-bold text-white text-sm">
                            {monthNames[currentMonth]} {currentYear}
                        </div>
                        <button onClick={nextMonth} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                            <ChevronRight size={18} />
                        </button>
                        <button onClick={goToToday} className="ml-2 px-3 py-1 text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white rounded-md transition">
                            Today
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid Area */}
            <div className={`flex-1 overflow-auto p-6 transition-all duration-300 ${selectedTask ? 'mr-[400px]' : ''}`}>
                <div className="bg-[#1e293b] border border-gray-700 rounded-2xl overflow-hidden shadow-2xl min-w-[800px] h-full flex flex-col">

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-700 last:border-0">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                        {blanks.map(blank => (
                            <div key={`blank-${blank}`} className="bg-[#0f172a]/30 border-r border-b border-gray-700/50 p-2"></div>
                        ))}

                        {days.map(day => {
                            const dayTasks = getTasksForDay(day);
                            const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                            return (
                                <div key={day} className={`border-r border-b border-gray-700 p-2 overflow-y-auto custom-scrollbar relative transition min-h-[120px] ${isToday ? 'bg-indigo-900/10' : 'hover:bg-gray-800/30'}`}>
                                    <span className={`text-xs font-bold mb-2 inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}>
                                        {day}
                                    </span>

                                    <div className="space-y-1.5 mt-1">
                                        {dayTasks.map(task => (
                                            <div
                                                key={task._id}
                                                onClick={() => setSelectedTask(task)}
                                                className={`text-[11px] px-2 py-1.5 rounded border cursor-pointer transition flex items-center justify-between gap-2 group ${getStatusColor(task.status)}`}
                                                title={`${task.title} - ${task.status}`}
                                            >
                                                <span className="truncate font-medium">{task.title}</span>

                                                {/* Assigned User Avatar Badge */}
                                                {task.assignedTo && (
                                                    <div className="w-4 h-4 rounded-full bg-gray-900 flex-shrink-0 overflow-hidden flex items-center justify-center text-[8px] font-bold text-white border border-gray-700/50">
                                                        {task.assignedTo.avatar ? (
                                                            <img src={task.assignedTo.avatar} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            task.assignedTo.name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Task Detail Sidebar */}
            {selectedTask && (
                <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </div>
    );
};

export default ProjectCalendar;