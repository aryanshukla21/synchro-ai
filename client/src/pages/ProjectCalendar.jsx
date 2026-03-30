import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Kanban as KanbanIcon, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import { useSocket } from '../contexts/SocketContext';
import TaskDetailPanel from '../components/kanban/TaskDetailPanel';

const ProjectCalendar = () => {
    const { projectId } = useParams();
    const { showToast } = useToast();
    const { socket } = useSocket();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

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

    useEffect(() => {
        if (!socket || !projectId) return;
        socket.emit('joinProject', projectId);

        const handleTaskUpdated = (updatedTask) => {
            setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
            setSelectedTask(prev => prev && prev._id === updatedTask._id ? updatedTask : prev);
        };

        const handleTaskCreated = (newTask) => setTasks(prev => [...prev, newTask]);
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
            return (taskDate.getDate() === day && taskDate.getMonth() === currentMonth && taskDate.getFullYear() === currentYear);
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
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-gray-400 text-sm">Plotting tasks on calendar...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh)] bg-[#0f172a] text-gray-300 relative overflow-hidden">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-0 bg-[#0f172a] flex-shrink-0 animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                    {/* REMOVED MENU BUTTON HERE */}
                    <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <CalendarIcon className="text-indigo-500" size={20} /> <span className="hidden sm:inline">Project</span> Timeline
                    </h1>
                </div>

                <div className="flex items-center gap-3 sm:gap-6 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <div className="bg-[#1e293b] p-1 rounded-lg border border-gray-700 flex items-center shrink-0">
                        <Link to={`/project/${projectId}`} className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-white rounded-md transition flex items-center gap-1.5">
                            <KanbanIcon size={14} /> <span className="hidden sm:inline">Board</span>
                        </Link>
                        <div className="px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold bg-indigo-600 text-white rounded-md shadow flex items-center gap-1.5 pointer-events-none">
                            <CalendarIcon size={14} /> <span className="hidden sm:inline">Calendar</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 bg-[#1e293b] p-1 sm:p-1.5 rounded-xl border border-gray-700 shrink-0">
                        <button onClick={prevMonth} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                            <ChevronLeft size={16} />
                        </button>
                        <div className="w-28 sm:w-36 text-center font-bold text-white text-xs sm:text-sm truncate">
                            {monthNames[currentMonth]} {currentYear}
                        </div>
                        <button onClick={nextMonth} className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
                            <ChevronRight size={16} />
                        </button>
                        <button onClick={goToToday} className="ml-1 sm:ml-2 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold bg-gray-700 hover:bg-gray-600 text-white rounded-md transition">
                            Today
                        </button>
                    </div>
                </div>
            </div>

            <div className={`flex-1 overflow-auto p-4 sm:p-6 transition-all duration-300 ${selectedTask ? 'lg:mr-[400px]' : ''}`}>
                <div className="bg-[#1e293b] border border-gray-700 rounded-2xl overflow-x-auto shadow-2xl h-full flex flex-col custom-scrollbar">
                    <div className="min-w-[800px] flex-1 flex flex-col">
                        <div className="grid grid-cols-7 bg-gray-800 border-b border-gray-700 flex-shrink-0">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-2.5 sm:py-3 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider border-r border-gray-700 last:border-0">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                            {blanks.map(blank => (
                                <div key={`blank-${blank}`} className="bg-[#0f172a]/30 border-r border-b border-gray-700/50 p-2"></div>
                            ))}

                            {days.map(day => {
                                const dayTasks = getTasksForDay(day);
                                const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                                return (
                                    <div key={day} className={`border-r border-b border-gray-700 p-1.5 sm:p-2 overflow-y-auto custom-scrollbar relative transition min-h-[100px] sm:min-h-[120px] ${isToday ? 'bg-indigo-900/10' : 'hover:bg-gray-800/30'}`}>
                                        <span className={`text-[10px] sm:text-xs font-bold mb-1.5 sm:mb-2 inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full ${isToday ? 'bg-indigo-500 text-white' : 'text-gray-400'}`}>
                                            {day}
                                        </span>

                                        <div className="space-y-1 sm:space-y-1.5 mt-1">
                                            {dayTasks.map(task => (
                                                <div
                                                    key={task._id}
                                                    onClick={() => setSelectedTask(task)}
                                                    className={`text-[9px] sm:text-[11px] px-1.5 sm:px-2 py-1 sm:py-1.5 rounded border cursor-pointer transition flex items-center justify-between gap-1 sm:gap-2 group ${getStatusColor(task.status)}`}
                                                    title={`${task.title} - ${task.status}`}
                                                >
                                                    <span className="truncate font-medium">{task.title}</span>
                                                    {task.assignedTo && (
                                                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gray-900 flex-shrink-0 overflow-hidden flex items-center justify-center text-[7px] sm:text-[8px] font-bold text-white border border-gray-700/50">
                                                            {task.assignedTo.avatar ? <img src={task.assignedTo.avatar} alt="" className="w-full h-full object-cover" /> : task.assignedTo.name?.charAt(0) || '?'}
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
            </div>

            {selectedTask && (
                <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </div>
    );
};

export default ProjectCalendar;