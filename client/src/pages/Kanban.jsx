import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import TaskCard from '../components/kanban/TaskCard';
import TaskDetailPanel from '../components/kanban/TaskDetailPanel';
import {
    Search, Menu, AlertTriangle, CheckCircle2, XCircle,
    ChevronDown, Loader2, Calendar as CalendarIcon, Kanban as KanbanIcon
} from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';

const Kanban = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const { projectId } = useParams();
    const { socket } = useSocket();
    const { showToast } = useToast();

    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Pagination State
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [paginationMeta, setPaginationMeta] = useState(null);

    const fetchTasks = async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            else setLoadingMore(true);

            const endpoint = projectId
                ? `/task/project/${projectId}?page=${pageNumber}&limit=50`
                : `/task/user/me?page=${pageNumber}&limit=50`;

            const { data } = await api.get(endpoint);

            if (pageNumber === 1) {
                setTasks(data.data);
            } else {
                // Prevent duplicate tasks when appending
                setTasks(prev => {
                    const existingIds = new Set(prev.map(t => t._id));
                    const newTasks = data.data.filter(t => !existingIds.has(t._id));
                    return [...prev, ...newTasks];
                });
            }
            setPaginationMeta(data.pagination);
        } catch (error) {
            console.error("Failed to load tasks", error);
            showToast('Failed to load tasks', 'error');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Reset page state to 1 whenever the projectId route changes
    useEffect(() => {
        setPage(1);
        setSearchQuery(''); // Clear search on project switch
        fetchTasks(1);
    }, [projectId]);

    // Real-Time Socket Connection & Event Listeners
    useEffect(() => {
        if (!socket) return;

        if (projectId) {
            socket.emit('joinProject', projectId);
        }

        const handleTaskUpdated = (updatedTask) => {
            setTasks((prevTasks) =>
                prevTasks.map(task => task._id === updatedTask._id ? updatedTask : task)
            );
            setSelectedTask((prevSelected) =>
                prevSelected && prevSelected._id === updatedTask._id ? updatedTask : prevSelected
            );
        };

        const handleTaskCreated = (newTask) => {
            setTasks((prevTasks) => [newTask, ...prevTasks]); // Put new tasks at the top
        };

        const handleTaskDeleted = (deletedTaskId) => {
            setTasks((prevTasks) => prevTasks.filter(task => task._id !== deletedTaskId));
            setSelectedTask((prevSelected) =>
                prevSelected && prevSelected._id === deletedTaskId ? null : prevSelected
            );
        };

        // Match backend kebab-case event names
        socket.on('task-updated', handleTaskUpdated);
        socket.on('task-created', handleTaskCreated);
        socket.on('task-deleted', handleTaskDeleted);

        return () => {
            if (projectId) {
                socket.emit('leaveProject', projectId);
            }
            socket.off('task-updated', handleTaskUpdated);
            socket.off('task-created', handleTaskCreated);
            socket.off('task-deleted', handleTaskDeleted);
        };
    }, [socket, projectId]);

    // Load More Logic
    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTasks(nextPage);
    };

    // Accept/Decline Handler
    const handleResponse = async (taskId, response) => {
        try {
            await api.post(`/task/${taskId}/respond`, { response });
            showToast(`Task ${response}ed successfully`, 'success');
        } catch (err) {
            showToast(err.response?.data?.message || "Action failed", 'error');
        }
    };

    // OPTIMIZATION: Memoize column distribution & handle search filtering locally
    const { columns, pendingTasks } = useMemo(() => {
        const cols = {
            'To-Do': [],
            'In-Progress': [],
            'Review-Requested': [],
            'Merged': []
        };
        const pending = [];

        // Filter tasks based on the search query
        const filteredTasks = tasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        filteredTasks.forEach(task => {
            if (task.assignmentStatus === 'Pending') {
                pending.push(task);
            } else if (cols[task.status] && (task.assignmentStatus === 'Active' || task.assignmentStatus === 'Accepted' || !task.assignmentStatus)) {
                cols[task.status].push(task);
            }
        });

        return { columns: cols, pendingTasks: pending };
    }, [tasks, searchQuery]); // Only recalculate when tasks or search query change

    const columnColors = {
        'To-Do': 'border-t-gray-500',
        'In-Progress': 'border-t-cyan-500',
        'Review-Requested': 'border-t-yellow-500',
        'Merged': 'border-t-emerald-500',
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center h-full text-white bg-[#0f172a]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-gray-400">Loading Board...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh)] bg-[#0f172a] text-gray-300 relative overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#0f172a] flex-shrink-0 animate-in fade-in duration-300">
                <div className="flex items-center gap-4">
                    {!isSidebarOpen && (
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 bg-[#1e293b] text-white rounded-lg hover:bg-indigo-600 transition"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                    <h1 className="text-xl font-bold text-white">Kanban Board</h1>
                </div>

                <div className="flex gap-4 items-center">

                    {/* --- THE VIEW SWITCHER --- */}
                    {projectId && (
                        <div className="hidden md:flex bg-[#1e293b] p-1 rounded-lg border border-gray-700 items-center">
                            <div className="px-4 py-1.5 text-sm font-bold bg-indigo-600 text-white rounded-md shadow flex items-center gap-2 pointer-events-none">
                                <KanbanIcon size={16} /> Board
                            </div>
                            <Link
                                to={`/project/${projectId}/calendar`}
                                className="px-4 py-1.5 text-sm font-bold text-gray-400 hover:text-white rounded-md transition flex items-center gap-2"
                            >
                                <CalendarIcon size={16} /> Calendar
                            </Link>
                        </div>
                    )}

                    {/* LOAD MORE BUTTON */}
                    {paginationMeta && paginationMeta.page < paginationMeta.totalPages && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="bg-[#1e293b] hover:bg-gray-800 border border-gray-700 text-xs text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50"
                        >
                            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                            {loadingMore ? 'Loading...' : 'Load Older Tasks'}
                        </button>
                    )}

                    {/* DYNAMIC SEARCH BAR */}
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#1e293b] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-500 w-64 text-white transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Board Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedTask ? 'mr-[400px]' : ''}`}>
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    {/* PENDING INVITATIONS SECTION */}
                    {pendingTasks.length > 0 && (
                        <div className="mb-8 p-6 bg-[#1e293b]/50 border border-yellow-500/20 rounded-xl animate-in fade-in slide-in-from-top-4">
                            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-yellow-500" />
                                Pending Invitations ({pendingTasks.length})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingTasks.map(task => (
                                    <div key={task._id} className="bg-[#0f172a] border border-gray-700 p-5 rounded-lg shadow-lg flex flex-col gap-3 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg leading-tight">{task.title}</h3>
                                            <p className="text-xs text-gray-500 mt-1">Project: <span className="text-indigo-400">{task.project?.title || 'Unknown Project'}</span></p>
                                        </div>
                                        <div className="flex gap-3 mt-2 pt-2 border-t border-gray-800">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleResponse(task._id, 'accept'); }}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded flex items-center justify-center gap-2 text-xs font-bold transition"
                                            >
                                                <CheckCircle2 size={14} /> Accept
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleResponse(task._id, 'decline'); }}
                                                className="flex-1 bg-gray-800 hover:bg-red-600 hover:text-white text-gray-400 py-1.5 rounded flex items-center justify-center gap-2 text-xs font-bold transition border border-gray-700"
                                            >
                                                <XCircle size={14} /> Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Standard Kanban Columns */}
                    <div className="flex gap-6 h-full min-w-[1000px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {Object.keys(columns).map((status) => (
                            <div key={status} className="flex-1 flex flex-col min-w-[280px]">
                                <div className={`flex justify-between items-center mb-4 px-4 py-3 bg-[#1e293b] rounded-lg border-t-4 ${columnColors[status]} border-x border-b border-gray-700 shadow-sm`}>
                                    <h3 className="font-bold text-sm text-white">{status}</h3>
                                    <span className="bg-gray-700 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                                        {columns[status].length}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-10">
                                    {columns[status].map((task) => (
                                        <TaskCard key={task._id} task={task} onClick={setSelectedTask} />
                                    ))}
                                    {columns[status].length === 0 && (
                                        <div className="border-2 border-dashed border-gray-700 rounded-lg h-24 flex items-center justify-center text-gray-500 text-sm">
                                            No tasks here
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedTask && (
                <TaskDetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />
            )}
        </div>
    );
};

export default Kanban;