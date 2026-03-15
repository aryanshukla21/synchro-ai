import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import {
    ArrowLeft, Save, Clock, History, AlertTriangle,
    FileText, User, Loader2, Paperclip, UploadCloud, Download, Play, Github, Send
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
    const [githubLink, setGithubLink] = useState('');

    // Presence Indicators State
    const [activeEditors, setActiveEditors] = useState([]);

    // Form & Upload State
    const [formData, setFormData] = useState({});
    const [isUploading, setIsUploading] = useState(false);

    // Permission Checks
    const isOwner = task && String(user?._id) === String(task.project?.owner?._id || task.project?.owner || task.createdBy?._id || task.createdBy);
    const isAssignee = task && String(user?._id) === String(task.assignedTo?._id || task.assignedTo);

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

    // --- SOCKET LOGIC ---
    useEffect(() => {
        if (!socket || !task) return;
        socket.emit('joinProject', task.project._id || task.project);

        const handleTaskUpdated = (updatedTask) => {
            if (updatedTask._id === taskId) {
                setTask(updatedTask);
                if (!isOwner) {
                    setFormData({
                        title: updatedTask.title,
                        description: updatedTask.description,
                        status: updatedTask.status,
                        priority: updatedTask.priority,
                    });
                }
            }
        };

        socket.on('taskUpdated', handleTaskUpdated);
        return () => {
            socket.off('taskUpdated', handleTaskUpdated);
        };
    }, [socket, task, taskId]);

    // --- WORKFLOW HANDLERS ---

    const handleStartWorking = async () => {
        try {
            const { data } = await api.patch(`/task/${taskId}/status`, { status: 'In-Progress' });
            setTask(data.data);
            showToast("Task marked as In-Progress!", "success");
        } catch (err) {
            showToast("Failed to start task", "error");
        }
    };

    const handleSubmitWork = async (e) => {
        e.preventDefault();
        if (!githubLink.includes('github.com')) {
            return showToast("Please provide a valid GitHub link", "error");
        }
        setIsSaving(true);
        try {
            // We reuse the update endpoint to save the link and trigger status change logic
            // Ideally, you'd have a specific /submit endpoint, but we'll adapt updateTask
            const { data } = await api.put(`/task/${taskId}`, {
                status: 'Review-Requested',
                description: formData.description + `\n\n--- SUBMISSION ---\nGitHub: ${githubLink}`
            });
            setTask(data.data);
            setGithubLink('');
            showToast("Work submitted for review!", "success");
        } catch (err) {
            showToast("Submission failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isOwner) return; // Guard
        setIsSaving(true);
        try {
            const { data } = await api.put(`/task/${taskId}`, formData);
            setTask(data.data);
            showToast("Task updated successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to save", "error");
        } finally {
            setIsSaving(false);
        }
    };

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
            setTask(data.data);
            // Automatic move to Review-Requested if a contributor uploads work
            if (!isOwner && task.status === 'In-Progress') {
                await api.patch(`/task/${taskId}/status`, { status: 'Review-Requested' });
            }
            showToast('File submitted successfully', 'success');
        } catch (err) {
            showToast('Failed to upload file', 'error');
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    if (loading) return <div className="flex-1 flex justify-center items-center h-full bg-[#0f172a]"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

    return (
        <div className="flex flex-col h-full bg-[#0f172a] text-gray-300">
            <header className="px-6 py-4 border-b border-gray-800 bg-[#0f172a] flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition"><ArrowLeft size={20} /></button>
                    <div>
                        <h1 className="text-lg font-bold text-white">Task Workspace</h1>
                        <p className="text-xs text-gray-500">{task?.status} • {task?.priority} Priority</p>
                    </div>
                </div>
                <div className="flex bg-[#1e293b] p-1 rounded-lg border border-gray-700">
                    <button onClick={() => setActiveTab('details')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'details' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>Details</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition flex items-center gap-1 ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                        <History size={14} /> Changelog
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
                {activeTab === 'details' && (
                    <div className="space-y-6">
                        {/* READ ONLY WARNING FOR CONTRIBUTORS */}
                        {!isOwner && (
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex items-center gap-3">
                                <FileText className="text-indigo-400" size={18} />
                                <p className="text-xs text-indigo-300">You are in <b>Contributor Mode</b>. Core details are managed by the project owner.</p>
                            </div>
                        )}

                        <div className="bg-[#1e293b] border border-gray-700 p-6 rounded-xl shadow-lg space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Task Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    disabled={!isOwner}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 transition ${!isOwner && 'opacity-70 cursor-not-allowed'}`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                                    <select
                                        value={formData.status}
                                        disabled={!isOwner}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className={`w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 ${!isOwner && 'opacity-70 cursor-not-allowed'}`}
                                    >
                                        <option value="To-Do">To-Do</option>
                                        <option value="In-Progress">In-Progress</option>
                                        <option value="Review-Requested">Review-Requested</option>
                                        <option value="Merged">Merged</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Priority</label>
                                    <select
                                        value={formData.priority}
                                        disabled={!isOwner}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value })}
                                        className={`w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2.5 px-4 text-white focus:outline-none focus:border-indigo-500 ${!isOwner && 'opacity-70 cursor-not-allowed'}`}
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                                <textarea
                                    value={formData.description || ''}
                                    disabled={!isOwner}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className={`w-full bg-[#0f172a] border border-gray-600 rounded-lg py-3 px-4 text-white h-32 focus:outline-none focus:border-indigo-500 resize-none ${!isOwner && 'opacity-70 cursor-not-allowed'}`}
                                />
                            </div>
                        </div>

                        {/* WORKFLOW ACTIONS FOR CONTRIBUTOR */}
                        {!isOwner && isAssignee && (
                            <div className="bg-[#1e293b] border border-gray-700 p-6 rounded-xl shadow-lg">
                                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                    <Clock size={16} className="text-indigo-400" /> Workflow Actions
                                </h3>

                                {task.status === 'To-Do' && (
                                    <button
                                        onClick={handleStartWorking}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20"
                                    >
                                        <Play size={18} /> Start Working on Task
                                    </button>
                                )}

                                {task.status === 'In-Progress' && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-[#0f172a] rounded-lg border border-gray-700">
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block flex items-center gap-2">
                                                <Github size={14} /> Submit GitHub Repository
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="url"
                                                    placeholder="https://github.com/user/repo"
                                                    value={githubLink}
                                                    onChange={(e) => setGithubLink(e.target.value)}
                                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                                                />
                                                <button
                                                    onClick={handleSubmitWork}
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition"
                                                >
                                                    <Send size={14} /> Submit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(task.status === 'Review-Requested' || task.status === 'Merged') && (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 italic">Task is currently under review or completed.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ATTACHMENTS */}
                        <div className="bg-[#1e293b] border border-gray-700 p-6 rounded-xl shadow-lg">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Paperclip size={16} /> {isOwner ? 'Project Files' : 'Submit Files'}
                            </h3>
                            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-500/5 transition relative overflow-hidden group">
                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploading} />
                                <UploadCloud size={32} className="mx-auto text-gray-500 mb-3 group-hover:text-indigo-400 transition" />
                                <p className="text-sm text-gray-300 font-medium">Click or drag a file to upload</p>
                                {isUploading && (
                                    <div className="absolute inset-0 bg-[#1e293b]/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                                        <Loader2 className="animate-spin text-indigo-500 mb-2" size={28} />
                                        <p className="text-xs font-bold text-indigo-400">Processing...</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {task?.attachments?.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-[#0f172a] p-3 rounded-lg border border-gray-700">
                                        <div className="flex items-center gap-3 truncate">
                                            <FileText className="text-indigo-400 shrink-0" size={20} />
                                            <span className="text-sm text-white truncate">{file.name}</span>
                                        </div>
                                        <a href={file.url} target="_blank" className="p-2 text-gray-400 hover:text-indigo-400"><Download size={16} /></a>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {isOwner && (
                            <div className="flex justify-end">
                                <button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition">
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-6">
                        {/* Existing changelog rendering remains same */}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TaskWorkPage;