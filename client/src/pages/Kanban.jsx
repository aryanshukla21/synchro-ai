import { useState, useEffect } from 'react';
import { useOutletContext, useParams } from 'react-router-dom'; // Imported useParams
import api from '../api/axios';
import TaskCard from '../components/kanban/TaskCard';
import TaskDetailPanel from '../components/kanban/TaskDetailPanel';
import { Search, Menu, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext'; // Import socket hook

const Kanban = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const { projectId } = useParams(); // Get projectId from route if applicable
    const { socket } = useSocket(); // Initialize socket
    const [tasks, setTasks] = useState([]);
    const [selectedTask, setSelectedTask] = useState(null);
    const [loading, setLoading] = useState(true);

    // Define Columns
    const columns = {
        'To-Do': [],
        'In-Progress': [],
        'Review-Requested': [],
        'Merged': []
    };

    // Separate list for invites
    const pendingTasks = [];

    const fetchTasks = async () => {
        try {
            // Adjust this route if you are viewing a specific project vs all user tasks
            const endpoint = projectId ? `/task/project/${projectId}` : '/task/user/me';
            const { data } = await api.get(endpoint);
            setTasks(data.data);
        } catch (error) {
            console.error("Failed to load tasks", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchTasks();
    }, [projectId]);

    // Real-Time Socket Connection & Event Listeners
    useEffect(() => {
        if (!socket) return;

        // If we are in a specific project board, join that room.
        // If not, we rely on the backend sending updates to the user's specific room.
        if (projectId) {
            socket.emit('joinProject', projectId);
        }

        // Listener for when a task is updated (e.g., dragged to a new column)
        const handleTaskUpdated = (updatedTask) => {
            setTasks((prevTasks) =>
                prevTasks.map(task => task._id === updatedTask._id ? updatedTask : task)
            );

            // Optional: If the updated task is currently selected, update the detail panel
            setSelectedTask((prevSelected) =>
                prevSelected && prevSelected._id === updatedTask._id ? updatedTask : prevSelected
            );
        };

        // Listener for new task creation
        const handleTaskCreated = (newTask) => {
            setTasks((prevTasks) => [...prevTasks, newTask]);
        };

        // Listener for task deletion
        const handleTaskDeleted = (deletedTaskId) => {
            setTasks((prevTasks) => prevTasks.filter(task => task._id !== deletedTaskId));
            // Close the panel if the selected task was just deleted
            setSelectedTask((prevSelected) =>
                prevSelected && prevSelected._id === deletedTaskId ? null : prevSelected
            );
        };

        socket.on('taskUpdated', handleTaskUpdated);
        socket.on('taskCreated', handleTaskCreated);
        socket.on('taskDeleted', handleTaskDeleted);

        // Cleanup function
        return () => {
            if (projectId) {
                socket.emit('leaveProject', projectId);
            }
            socket.off('taskUpdated', handleTaskUpdated);
            socket.off('taskCreated', handleTaskCreated);
            socket.off('taskDeleted', handleTaskDeleted);
        };
    }, [socket, projectId]);

    // Distribute tasks
    tasks.forEach(task => {
        // 1. Pending Invites Logic
        if (task.assignmentStatus === 'Pending') {
            pendingTasks.push(task);
        }
        // 2. Active Board Logic
        else if (columns[task.status] && (task.assignmentStatus === 'Active' || task.assignmentStatus === 'Accepted' || !task.assignmentStatus)) {
            columns[task.status].push(task);
        }
    });

    // Accept/Decline Handler
    const handleResponse = async (taskId, response) => {
        try {
            await api.post(`/task/${taskId}/respond`, { response });
            fetchTasks(); // Refresh or let socket handle it
            alert(`Task ${response}ed successfully`);
        } catch (err) {
            alert(err.response?.data?.message || "Action failed");
        }
    };

    const columnColors = {
        'To-Do': 'border-t-gray-500',
        'In-Progress': 'border-t-cyan-500',
        'Review-Requested': 'border-t-yellow-500',
        'Merged': 'border-t-emerald-500',
    };

    if (loading) return <div className="p-10 text-white">Loading Board...</div>;

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

                {/* Search & Actions */}
                <div className="flex gap-3">
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