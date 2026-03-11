import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Clock, ArrowLeft, Github, Upload,
    CheckCircle, FileText, Play
} from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';

const TaskWorkPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');
    const [isOverdue, setIsOverdue] = useState(false);

    // Submission State
    const [githubUrl, setGithubUrl] = useState('');
    const [file, setFile] = useState(null);
    const [comment, setComment] = useState(''); // Added comment state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch Task
    useEffect(() => {
        const fetchTask = async () => {
            try {
                const { data } = await api.get(`/task/${id}`);
                setTask(data.data || data);
            } catch (error) {
                console.error(error);
                showToast('Failed to load task details', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchTask();
    }, [id]);

    // Reverse Countdown Logic
    useEffect(() => {
        if (!task?.deadline) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const deadline = new Date(task.deadline).getTime();
            const distance = deadline - now;

            if (distance < 0) {
                setIsOverdue(true);
                setTimeLeft('OVERDUE');
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [task]);

    const handleUpdateTask = async (updates) => {
        try {
            const { data } = await api.put(`/task/${id}`, updates);
            setTask(data.data);
            showToast('Task updated!', 'success');
        } catch (error) {
            showToast('Update failed', 'error');
        }
    };

    const handleRequestExtension = async () => {
        if (confirm("Send a request to the project owner for more time?")) {
            try {
                showToast('Extension request sent to owner.', 'success');
            } catch (error) {
                showToast('Failed to send request.', 'error');
            }
        }
    };

    const handleSubmitWork = async (e) => {
        e.preventDefault();

        // Validation Check
        if (!githubUrl.trim() && !file) {
            showToast('You must provide a GitHub Link OR upload a file to submit.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            // Create FormData object to handle multipart/form-data (files + text)
            const formData = new FormData();

            // Append required fields based on your backend controller
            formData.append('taskId', id);

            if (githubUrl.trim()) {
                formData.append('contentUrl', githubUrl.trim());
            }

            if (file) {
                // The name 'file' must match what your multer middleware expects e.g., upload.single('file')
                formData.append('file', file);
            }

            if (comment.trim()) {
                formData.append('comment', comment.trim());
            }

            // POST to the actual submissions route
            await api.post('/submissions/submit', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            showToast('Work submitted successfully for review!', 'success');
            navigate(-1);
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.message || 'Submission failed';
            showToast(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;
    if (!task) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Task not found</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans p-6 md:p-10">
            {/* Header */}
            <header className="max-w-5xl mx-auto mb-10 flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                    <ArrowLeft size={20} /> Back to Board
                </button>
                <div className={`px-4 py-2 rounded-lg font-mono font-bold text-xl flex items-center gap-3 ${isOverdue ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
                    <Clock size={20} />
                    {timeLeft || "No Deadline"}
                </div>
            </header>

            <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left: Task Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-4">{task.title}</h1>
                        <div className="flex gap-4 mb-6">
                            <span className="bg-[#1e293b] px-3 py-1 rounded-full text-sm border border-gray-700 text-gray-300">
                                {task.project?.title || "Project Task"}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm border ${task.priority === 'High' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                }`}>
                                {task.priority} Priority
                            </span>
                        </div>
                        <div className="bg-[#1e293b] p-6 rounded-2xl border border-gray-700">
                            <h3 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-4">Description</h3>
                            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {task.description || "No description provided."}
                            </p>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-4">
                        {['To-Do', 'To-todo'].includes(task.status) && (
                            <button
                                onClick={() => handleUpdateTask({ status: 'In-Progress' })}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2"
                            >
                                <Play size={20} /> Mark In-Progress
                            </button>
                        )}
                        <button
                            onClick={handleRequestExtension}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition"
                        >
                            Request Extension
                        </button>
                    </div>
                </div>

                {/* Right: Submission Panel */}
                <div className="bg-[#1e293b] p-8 rounded-2xl border border-gray-700 h-fit sticky top-10">
                    {task.status === 'Review-Requested' ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Under Review</h2>
                            <p className="text-gray-400 text-sm">Your work has been submitted and is currently waiting for manager approval.</p>
                        </div>
                    ) : task.status === 'Merged' ? (
                        <div className="text-center py-10">
                            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Work Approved!</h2>
                            <p className="text-gray-400 text-sm">This task has been successfully merged and closed.</p>
                        </div>
                    ) : (
                        <>
                            <h2 className="text-2xl font-bold text-white mb-6">Submit Work</h2>
                            <form onSubmit={handleSubmitWork} className="space-y-6">
                                {/* ... existing form inputs (githubUrl, file, comment) ... */}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : <><CheckCircle size={20} /> Submit for Review</>}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TaskWorkPage;