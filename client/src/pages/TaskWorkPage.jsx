import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import {
    ArrowLeft, Save, Clock, History, AlertTriangle,
    FileText, User, Loader2, Paperclip, UploadCloud, Download
} from 'lucide-react';

const TaskWorkPage = () => {
    const { id: taskId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { showToast } = useToast();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('details');

    // Presence Indicators State
    const [activeEditors, setActiveEditors] = useState([]);
    const typingTimeoutRef = useRef(null);

    // Form & Upload State
    const [formData, setFormData] = useState({});
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchTask();
    }, [taskId]);

    const fetchTask = async () => {
        try {
            const { data } = await api.get(`/task/${taskId}`);
            setTask(data.data);
            setFormData({
                title: data.data.title,
                description: data.data.description,
                status: data.data.status,
                priority: data.data.priority,
            });
        } catch (error) {
            showToast("Failed to load task", "error");
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    // --- SOCKET LOGIC FOR PRESENCE INDICATORS ---
    useEffect(() => {
        if (!socket || !task) return;

        // Join the project room to hear typing events
        socket.emit('joinProject', task.project._id || task.project);

        const handleUserTyping = ({ taskId: editingTaskId, user: editingUser }) => {
            if (editingTaskId === taskId && editingUser._id !== user._id) {
                setActiveEditors(prev => {
                    if (!prev.find(u => u._id === editingUser._id)) {
                        return [...prev, editingUser];
                    }
                    return prev;
                });
            }
        };

        const handleUserStopped = ({ taskId: editingTaskId, user: editingUser }) => {
            if (editingTaskId === taskId) {
                setActiveEditors(prev => prev.filter(u => u._id !== editingUser._id));
            }
        };

        const handleTaskUpdated = (updatedTask) => {
            if (updatedTask._id === taskId) {
                setTask(updatedTask);
                // Update local form state if we aren't currently focusing the inputs
                // (In a production app, you might want to merge changes or warn the user)
                showToast("Task was just updated by someone else", "info");
            }
        };

        socket.on('task-being-edited', handleUserTyping);
        socket.on('task-stopped-editing', handleUserStopped);
        socket.on('taskUpdated', handleTaskUpdated);

        return () => {
            socket.emit('leaveProject', task.project._id || task.project);
            socket.off('task-being-edited', handleUserTyping);
            socket.off('task-stopped-editing', handleUserStopped);
            socket.off('taskUpdated', handleTaskUpdated);
        };
    }, [socket, task, taskId, user._id]);

    // Handle Input Focus/Blur to emit typing states
    const handleFocus = () => {
        if (socket && task) {
            socket.emit('task-typing-start', { projectId: task.project._id || task.project, taskId, user });
        }
    };

    const handleBlur = () => {
        if (socket && task) {
            socket.emit('task-typing-stop', { projectId: task.project._id || task.project, taskId, user });
        }
    };

    // Auto-stop typing if the user unmounts or navigates away
    useEffect(() => {
        return () => handleBlur();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data } = await api.put(`/task/${taskId}`, formData);
            setTask(data.data);
            showToast("Task saved successfully", "success");
            handleBlur(); // Release the lock
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to save", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // --- FILE UPLOAD HANDLER ---
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        setIsUploading(true);
        try {
            const { data } = await api.post(`/task/${taskId}/attachments`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setTask(data.data); // Update UI with new file
            showToast('File uploaded successfully', 'success');
        } catch (err) {
            showToast('Failed to upload file', 'error');
        } finally {
            setIsUploading(false);
            e.target.value = ''; // Reset input
        }
    };

    if (loading) return <div className="flex-1 flex justify-center items-center h-full bg-[#0f172a]"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

    return (
        <div className="flex flex-col h-full bg-[#0f172a] text-gray-300">
            <header className="px-6 py-4 border-b border-gray-800 bg-[#0f172a] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-lg font-bold text-white flex items-center gap-2">Task Workspace</h1>
                        <p className="text-xs text-gray-500">{task?.title}</p>
                    </div>
                </div>
                <div className="flex bg-[#1e293b] p-1 rounded-lg border border-gray-700">
                    <button onClick={() => setActiveTab('details')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'details' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>Details</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        <History size={14} /> Changelog
                    </button>
                </div>
            </header>

            {/* PRESENCE WARNING BANNER */}
            {activeEditors.length > 0 && (
                <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 px-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                    <p className="text-sm text-amber-400">
                        <span className="font-bold">{activeEditors.map(u => u.name).join(', ')}</span> {activeEditors.length === 1 ? 'is' : 'are'} currently editing this task. Wait for them to finish to avoid overwriting data.
                    </p>
                </div>
            )}

            <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 max-w-5xl mx-auto w-full">
                {activeTab === 'details' && (
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="bg-[#1e293b] border border-gray-700 p-6 rounded-xl shadow-lg">
                            <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Task Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2.5 px-4 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Status</label>
                                    <select
                                        value={formData.status}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition"
                                    >
                                        <option value="To-Do">To-Do</option>
                                        <option value="In-Progress">In-Progress</option>
                                        <option value="Review-Requested">Review-Requested</option>
                                        <option value="Merged">Merged</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-3 px-4 text-white h-40 focus:outline-none focus:border-indigo-500 resize-none transition"
                                />
                            </div>

                            {/* --- ATTACHMENTS SECTION --- */}
                            <div className="mt-8 border-t border-gray-700 pt-8">
                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Paperclip size={16} /> Attachments & Files
                                </h3>

                                {/* Drag & Drop Zone */}
                                <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-500/5 transition relative overflow-hidden group">
                                    <input
                                        type="file"
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        disabled={isUploading}
                                    />
                                    <UploadCloud size={32} className="mx-auto text-gray-500 mb-3 group-hover:text-indigo-400 transition" />
                                    <p className="text-sm text-gray-300 font-medium">Click or drag a file to this area to upload</p>
                                    <p className="text-xs text-gray-500 mt-1">Supports Images, PDFs, and ZIP files.</p>

                                    {isUploading && (
                                        <div className="absolute inset-0 bg-[#1e293b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                            <Loader2 className="animate-spin text-indigo-500 mb-2" size={28} />
                                            <p className="text-xs font-bold text-indigo-400">Uploading to Cloudinary...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Render Uploaded Files */}
                                {task?.attachments?.length > 0 && (
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {task.attachments.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between bg-[#0f172a] p-3 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                                                        {file.url.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                            <img src={file.url} alt="preview" className="w-full h-full object-cover rounded opacity-80" />
                                                        ) : (
                                                            <FileText size={20} />
                                                        )}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                                        <p className="text-[10px] text-gray-500">{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition shrink-0" title="Download">
                                                    <Download size={16} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving || activeEditors.length > 0}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/20 transition disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {activeEditors.length > 0 ? 'Locked by Editor' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                )}

                {/* CHANGELOG VIEW */}
                {activeTab === 'history' && (
                    <div className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-lg p-6">
                        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <History className="text-indigo-400" size={20} /> Version History
                        </h2>

                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gray-700">
                            {task?.changelog?.length === 0 ? (
                                <p className="text-gray-500 text-center py-10">No changes recorded yet.</p>
                            ) : (
                                [...(task?.changelog || [])].reverse().map((log, idx) => (
                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 bg-[#0f172a] text-indigo-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 overflow-hidden z-10">
                                            {log.user?.avatar ? <img src={log.user.avatar} className="w-full h-full object-cover" /> : log.user?.name?.charAt(0)}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0f172a] p-4 rounded-xl border border-gray-700 shadow">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-200 text-sm">{log.user?.name}</span>
                                                <span className="text-xs text-gray-500">{new Date(log.changedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm text-gray-400">
                                                Changed <span className="font-bold text-white">{log.field}</span>
                                            </p>
                                            <div className="mt-2 text-xs bg-gray-800/50 rounded p-2 border border-gray-700/50 flex flex-col gap-1">
                                                <div className="flex gap-2">
                                                    <span className="text-rose-400 font-medium line-through decoration-rose-500/50">Old: {String(log.oldValue).substring(0, 50)}{String(log.oldValue).length > 50 && '...'}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <span className="text-emerald-400 font-medium">New: {String(log.newValue).substring(0, 50)}{String(log.newValue).length > 50 && '...'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TaskWorkPage;