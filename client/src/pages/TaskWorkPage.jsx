import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';
import {
    ArrowLeft, Save, Clock, History, FileText, Loader2,
    Paperclip, UploadCloud, Download, Play, Github, Send, X, CheckCircle
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

    // Unified Submission State
    const [githubLink, setGithubLink] = useState('');
    const [stagedFiles, setStagedFiles] = useState([]);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);

    // Form State
    const [formData, setFormData] = useState({});

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

    // --- FILE STAGING LOGIC ---
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (stagedFiles.length + files.length > 10) {
            return showToast("You can only upload up to 10 files at once", "error");
        }
        setStagedFiles(prev => [...prev, ...files]);
        e.target.value = ''; // Reset input so same file can be selected again if removed
    };

    const removeStagedFile = (index) => {
        setStagedFiles(prev => prev.filter((_, i) => i !== index));
    };

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

    // Handler for Contributor submitting work
    const handleContributorSubmit = async (e) => {
        e.preventDefault();

        if (stagedFiles.length === 0 && !githubLink.trim()) {
            return showToast("Please provide a GitHub link or select files to submit.", "error");
        }

        setIsSaving(true);
        try {
            let fileForSubmission = null;
            const filesToAttach = [...stagedFiles];

            // If no github link exists, reserve one file for the official Submission record
            if (!githubLink.trim() && filesToAttach.length > 0) {
                fileForSubmission = filesToAttach.pop();
            }

            // 1. Upload remaining staged files sequentially to task attachments
            for (const file of filesToAttach) {
                const fd = new FormData();
                fd.append('file', file);
                await api.post(`/task/${taskId}/attachments`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            // 2. Formally Submit the Work (Triggers Review-Requested)
            if (fileForSubmission) {
                const fd = new FormData();
                fd.append('file', fileForSubmission);
                fd.append('taskId', taskId);
                fd.append('comment', 'File Submission');

                // 🔥 FIX: Added /submit to the URL
                await api.post('/submissions/submit', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                // 🔥 FIX: Added /submit to the URL
                await api.post('/submissions/submit', {
                    taskId: taskId,
                    contentUrl: githubLink.trim(),
                    comment: stagedFiles.length > 0 ? 'GitHub Repo + Attached Files' : 'GitHub Repository Submission'
                });
            }

            // Clean up UI & update local state to hide the form
            setTask(prev => ({ ...prev, status: 'Review-Requested' }));
            setGithubLink('');
            setStagedFiles([]);
            showToast("Work submitted for review successfully!", "success");

        } catch (err) {
            showToast(err.response?.data?.message || "Submission failed", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Handler for Owner casually attaching files without submitting
    const handleOwnerUploadFiles = async () => {
        if (stagedFiles.length === 0) return;
        setIsUploadingFiles(true);
        try {
            for (const file of stagedFiles) {
                const fd = new FormData();
                fd.append('file', file);
                const { data } = await api.post(`/task/${taskId}/attachments`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setTask(data.data); // Update task to show the new file immediately
            }
            setStagedFiles([]);
            showToast("Files attached successfully", "success");
        } catch (err) {
            showToast("Failed to upload files", "error");
        } finally {
            setIsUploadingFiles(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!isOwner) return;
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

                        {/* UNIFIED WORKFLOW ACTIONS & UPLOAD FOR CONTRIBUTOR */}
                        {!isOwner && isAssignee && (
                            <div className="bg-[#1e293b] border border-gray-700 p-6 rounded-xl shadow-lg mt-6">
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
                                    <div className="space-y-6 border border-gray-700 p-5 rounded-xl bg-[#0f172a]">
                                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Submit Your Work</h4>

                                        {/* Github Link */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-2 block flex items-center gap-2">
                                                <Github size={14} /> GitHub Repository Link (Optional)
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://github.com/user/repo"
                                                value={githubLink}
                                                onChange={(e) => setGithubLink(e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* File Staging */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 mb-2 block flex items-center gap-2">
                                                <UploadCloud size={14} /> Attach Files (Optional, up to 10)
                                            </label>
                                            <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-indigo-500 transition relative">
                                                <input type="file" multiple onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                                <UploadCloud size={24} className="mx-auto text-gray-500 mb-2" />
                                                <p className="text-sm text-gray-300">Click or drag files here to stage</p>
                                            </div>

                                            {/* Preview Staged Files */}
                                            {stagedFiles.length > 0 && (
                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                    {stagedFiles.map((f, i) => (
                                                        <div key={i} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700">
                                                            <span className="text-xs text-gray-300 truncate pr-2">{f.name}</span>
                                                            <button onClick={() => removeStagedFile(i)} className="text-red-400 hover:text-red-300 p-1"><X size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Final Submit Button */}
                                        <button
                                            onClick={handleContributorSubmit}
                                            disabled={isSaving || (stagedFiles.length === 0 && !githubLink.trim())}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg"
                                        >
                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                            Submit Work for Review
                                        </button>
                                    </div>
                                )}

                                {(task.status === 'Review-Requested' || task.status === 'Merged') && (
                                    <div className="text-center py-6 border border-gray-700 rounded-xl bg-indigo-500/5">
                                        <CheckCircle size={32} className="mx-auto text-emerald-500 mb-3" />
                                        <h4 className="text-white font-bold mb-1">Work Submitted Successfully</h4>
                                        <p className="text-sm text-gray-400 max-w-sm mx-auto">
                                            Your work is currently locked under review or has been approved. If the owner requests revisions, this upload form will be unlocked.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* SHARED ATTACHMENTS VIEW & OWNER UPLOAD */}
                        <div className="bg-[#1e293b] border border-gray-700 p-6 rounded-xl shadow-lg mt-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Paperclip size={16} /> Attached Files
                            </h3>

                            {task?.attachments?.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                    {task.attachments.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between bg-[#0f172a] p-3 rounded-lg border border-gray-700">
                                            <div className="flex items-center gap-3 truncate">
                                                <FileText className="text-indigo-400 shrink-0" size={20} />
                                                <span className="text-sm text-white truncate">{file.name}</span>
                                            </div>
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-indigo-400"><Download size={16} /></a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic mb-4">No files attached to this task yet.</p>
                            )}

                            {isOwner && (
                                <div className="mt-4 border-t border-gray-700 pt-4">
                                    <h4 className="text-xs font-bold text-gray-400 mb-2">Upload New Files (Max 10)</h4>
                                    <div className="border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-indigo-500 transition relative mb-3">
                                        <input type="file" multiple onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <UploadCloud size={24} className="mx-auto text-gray-500 mb-2" />
                                        <p className="text-sm text-gray-300">Click or drag files here to stage</p>
                                    </div>

                                    {stagedFiles.length > 0 && (
                                        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-400 font-bold">Staged Files ({stagedFiles.length})</span>
                                                <button onClick={handleOwnerUploadFiles} disabled={isUploadingFiles} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1">
                                                    {isUploadingFiles ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
                                                    Upload Now
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {stagedFiles.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-600">
                                                        <span className="text-xs text-gray-300 truncate pr-2">{f.name}</span>
                                                        <button onClick={() => removeStagedFile(i)} className="text-red-400 hover:text-red-300 p-1"><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isOwner && (
                            <div className="flex justify-end mt-6">
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
                        {/* History mapping logic here */}
                    </div>
                )}
            </main>
        </div>
    );
};

export default TaskWorkPage;