import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import api from '../api/axios';
import TaskCard from '../components/kanban/TaskCard';
import TaskDetailPanel from '../components/kanban/TaskDetailPanel';
import { Search, Menu, AlertTriangle, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';

const Kanban = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const { projectId } = useParams();
    const { socket } = useSocket();
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [paginationMeta, setPaginationMeta] = useState(null);

    const columns = {
        'To-Do': [],
        'In-Progress': [],
        'Review-Requested': [],
        'Merged': []
    };

    const pendingTasks = [];

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
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // CRITICAL FIX 1: Reset page state to 1 whenever the projectId route changes
    useEffect(() => {
        setPage(1);
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
            setTasks((prevTasks) => [...prevTasks, newTask]);
        };

        const handleTaskDeleted = (deletedTaskId) => {
            setTasks((prevTasks) => prevTasks.filter(task => task._id !== deletedTaskId));
            setSelectedTask((prevSelected) =>
                prevSelected && prevSelected._id === deletedTaskId ? null : prevSelected
            );
        };

        socket.on('taskUpdated', handleTaskUpdated);
        socket.on('taskCreated', handleTaskCreated);
        socket.on('taskDeleted', handleTaskDeleted);

        return () => {
            if (projectId) {
                socket.emit('leaveProject', projectId);
            }
            socket.off('taskUpdated', handleTaskUpdated);
            socket.off('taskCreated', handleTaskCreated);
            socket.off('taskDeleted', handleTaskDeleted);
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

            // CRITICAL FIX 2: Removed fetchTasks(1) here.
            // If we refetch page 1, we lose paginated data.
            // The socket.on('taskUpdated') listener will automatically catch 
            // the assignmentStatus change and update the UI instantly!

            // Optional: You can use a lighter toast notification instead of alert
            // alert(`Task ${response}ed successfully`); 
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        }
    };

    // Distribute tasks
    tasks.forEach(task => {
        if (task.assignmentStatus === 'Pending') {
            pendingTasks.push(task);
        }
        else if (columns[task.status] && (task.assignmentStatus === 'Active' || task.assignmentStatus === 'Accepted' || !task.assignmentStatus)) {
            columns[task.status].push(task);
        }
    });

    const columnColors = {
        'To-Do': 'border-t-gray-500',
        'In-Progress': 'border-t-cyan-500',
        'Review-Requested': 'border-t-yellow-500',
        'Merged': 'border-t-emerald-500',
    };

    if (loading) return <div className="p-10 text-white animate-pulse">Loading Board...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh)] bg-[#0f172a] text-gray-300 relative overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#0f172a] flex-shrink-0">
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

                <div className="flex gap-3 items-center">
                    {/* LOAD MORE BUTTON */}
                    {paginationMeta && paginationMeta.page < paginationMeta.totalPages && (
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="bg-[#1e293b] hover:bg-gray-800 border border-gray-700 text-xs text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50 mr-2"
                        >
                            {loadingMore ? 'Loading...' : <><ChevronDown size={14} /> Load Older Tasks</>}
                        </button>
                    )}

                    <div className="relative hidden sm:block">
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        <input
                            placeholder="Search tasks..."
                            className="bg-[#1e293b] border border-gray-700 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-indigo-500 w-64 text-white"
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
                                    <div key={task._id} className="bg-[#0f172a] border border-gray-700 p-5 rounded-lg shadow-lg flex flex-col gap-3 relative overflow-hidden">
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
                    <div className="flex gap-6 h-full min-w-[1000px]">
                        {Object.keys(columns).map((status) => (
                            <div key={status} className="flex-1 flex flex-col min-w-[280px]">
                                <div className={`flex justify-between items-center mb-4 px-4 py-3 bg-[#1e293b] rounded-lg border-t-4 ${columnColors[status]} border-x border-b border-gray-700`}>
                                    <h3 className="font-bold text-sm text-white">{status}</h3>
                                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                                        {columns[status].length}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {columns[status].map((task) => (
                                        <TaskCard key={task._id} task={task} onClick={setSelectedTask} />
                                    ))}
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