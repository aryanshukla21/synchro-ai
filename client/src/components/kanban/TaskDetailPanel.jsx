import { useState, useEffect } from 'react';
import {
    X, CheckCircle, AlertTriangle, Play, Save,
    Calendar, Flag, User, Clock, CheckCircle2, XCircle,
    FileText, ExternalLink, MessageSquare, Send, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import { useSocket } from '../../contexts/SocketContext';

const TaskDetailPanel = ({ task, onClose, onUpdate }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { socket } = useSocket();

    const [timeLeft, setTimeLeft] = useState('');
    const [submissions, setSubmissions] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Comments State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        priority: 'Medium',
        deadline: ''
    });

    // Initialize Data
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title || '',
                description: task.description || '',
                priority: task.priority || 'Medium',
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''
            });
        }
    }, [task]);

    // --- PERMISSION CHECKS ---
    const isOwner = String(task?.createdBy?._id || task?.createdBy) === String(user?._id);
    const isAssignee = String(task?.assignedTo?._id || task?.assignedTo) === String(user?._id);

    // --- 1. FETCH SUBMISSIONS & COMMENTS ---
    useEffect(() => {
        const fetchTaskData = async () => {
            if (!task?._id) return;
            try {
                // Fetch Submissions
                const subRes = await api.get(`/submissions/task/${task._id}`);
                setSubmissions(subRes.data.data || []);

                // Fetch Comments
                const commentRes = await api.get(`/comments/task/${task._id}`);
                setComments(commentRes.data.data || []);
            } catch (error) {
                console.error("Failed to load task associated data", error);
            }
        };
        fetchTaskData();
    }, [task?._id]);

    // --- 2. COUNTDOWN LOGIC ---
    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!task?.deadline) return 'No Deadline';
            const difference = new Date(task.deadline) - new Date();
            if (difference < 0) return 'Overdue';
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            return `${days}d ${hours}h`;
        };
        setTimeLeft(calculateTimeLeft());
    }, [task?.deadline]);

    // --- 3. REAL-TIME SOCKET LISTENERS FOR COMMENTS ---
    useEffect(() => {
        if (!socket || !task?._id) return;

        const handleNewComment = (newComment) => {
            if (newComment.task === task._id) {
                setComments((prev) => {
                    // ANTI-DUPLICATION: Check if we already appended this comment from our own API response
                    if (prev.find(c => c._id === newComment._id)) return prev;
                    return [...prev, newComment];
                });
            }
        };

        const handleDeletedComment = (payload) => {
            if (payload.taskId === task._id) {
                setComments((prev) => prev.filter(c => c._id !== payload.commentId));
            }
        };

        socket.on('commentAdded', handleNewComment);
        socket.on('commentDeleted', handleDeletedComment);

        return () => {
            socket.off('commentAdded', handleNewComment);
            socket.off('commentDeleted', handleDeletedComment);
        };
    }, [socket, task?._id]);

    // --- HANDLERS ---
    const handleInviteResponse = async (response) => {
        try {
            const { data } = await api.post(`/task/${task._id}/respond`, { response: response.toLowerCase() });
            if (onUpdate) onUpdate(data.data);
            showToast(`Task ${response}ed`, 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Action failed', 'error');
        }
    };

    const handleSaveEdit = async () => {
        try {
            const { data } = await api.put(`/task/${task._id}`, formData);
            if (onUpdate) onUpdate(data.data);
            setIsEditing(false);
            showToast('Task updated successfully', 'success');
        } catch (error) {
            showToast('Failed to update task', 'error');
        }
    };

    const handleAdminReview = async (action) => {
        setIsProcessing(true);
        try {
            const { data } = await api.patch(`/task/${task._id}/review`, { action });
            if (onUpdate) onUpdate(data.data);
            showToast(`Task successfully ${action === 'Merge' ? 'Merged' : 'Returned'}`, 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Review failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Add Comment Handler
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            const { data } = await api.post('/comments', {
                taskId: task._id,
                text: newComment.trim()
            });

            // Optimistic UI: Update immediately for a snappy feel
            setComments((prev) => {
                if (prev.find(c => c._id === data.data._id)) return prev;
                return [...prev, data.data];
            });

            setNewComment('');
        } catch (error) {
            showToast('Failed to post comment', 'error');
            console.error(error);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Delete Comment
    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Are you sure you want to delete this comment?")) return;

        try {
            await api.delete(`/comments/${commentId}`);
            showToast('Comment deleted', 'success');
        } catch (error) {
            showToast('Failed to delete comment', 'error');
            console.error(error);
        }
    };

    const getAssigneeDisplay = () => {
        if (!task?.assignedTo) return { text: 'Unassigned', color: 'text-gray-500' };
        const name = task.assignedTo.name || 'Unknown User';
        if (task.assignmentStatus === 'Pending') return { text: `${name} (Pending)`, color: 'text-amber-400' };
        if (task.assignmentStatus === 'Declined') return { text: 'Declined', color: 'text-red-400' };
        return { text: name, color: 'text-indigo-400' };
    };

    if (!task) return null;
    const assigneeInfo = getAssigneeDisplay();
    const latestAIReview = submissions.find(s => s.aiReview && s.aiReview.score)?.aiReview;

    return (
        <>
            {/* Overlay for mobile to close modal when clicking outside */}
            <div className="fixed inset-0 bg-black/60 z-[90] lg:hidden backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="fixed inset-y-0 right-0 w-full md:w-[450px] lg:w-[500px] bg-[#1e293b] border-l border-gray-700 flex flex-col h-full shadow-2xl z-[100] font-sans animate-in slide-in-from-right duration-300">

                {/* HEADER */}
                <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-start sticky top-0 bg-[#1e293b] z-10 shadow-md">
                    <div className="flex-1 mr-2 sm:mr-4 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] sm:text-xs font-mono text-gray-500">#{task._id.slice(-4)}</span>
                            <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-bold border uppercase tracking-wider ${task.status === 'Merged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                task.status === 'Submitted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                    'bg-gray-700/50 text-gray-400 border-gray-600'
                                }`}>
                                {task.status}
                            </span>
                            {task.deadline && (
                                <div className="bg-gray-800 text-gray-300 flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 py-0.5 sm:py-1 rounded-full shrink-0">
                                    <Clock size={10} /> {timeLeft}
                                </div>
                            )}
                        </div>

                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded p-1.5 sm:p-2 text-white font-bold text-base sm:text-lg focus:border-indigo-500 outline-none mb-1"
                            />
                        ) : (
                            <h2 className="text-lg sm:text-xl font-bold text-white leading-tight mb-1 truncate">{task.title}</h2>
                        )}
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1 bg-gray-800 rounded-lg shrink-0">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">

                    {/* --- ADMIN REVIEW ACTIONS --- */}
                    {isOwner && task.status === 'Submitted' && (
                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 sm:p-5 space-y-3 sm:space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400">
                                <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider">Review Request</h3>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-400">Review the assignee's work below. You can merge it into the project or decline it for revision.</p>
                            <div className="flex gap-2 sm:gap-3">
                                <button
                                    disabled={isProcessing}
                                    onClick={() => handleAdminReview('Merge')}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 sm:gap-2"
                                >
                                    <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Merge
                                </button>
                                <button
                                    disabled={isProcessing}
                                    onClick={() => handleAdminReview('Decline')}
                                    className="flex-1 bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-500/20 py-2 sm:py-2.5 rounded-lg text-[10px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 sm:gap-2"
                                >
                                    <XCircle size={14} className="sm:w-4 sm:h-4" /> Decline
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- ASSIGNEE INVITE ACTION --- */}
                    {isAssignee && task.assignmentStatus === 'Pending' && (
                        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 sm:p-5 animate-pulse">
                            <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px]" />
                                <h3 className="text-xs sm:text-sm font-bold">New Assignment</h3>
                            </div>
                            <p className="text-[10px] sm:text-xs text-gray-400 mb-3 sm:mb-4">Accept to start tracking time.</p>
                            <div className="flex gap-2 sm:gap-3">
                                <button onClick={() => handleInviteResponse('Accept')} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition">Accept</button>
                                <button onClick={() => handleInviteResponse('Decline')} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold transition">Decline</button>
                            </div>
                        </div>
                    )}

                    {/* --- CONTROLS --- */}
                    <div className="flex gap-2 sm:gap-3">
                        {isOwner && (
                            isEditing ? (
                                <button onClick={handleSaveEdit} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition">
                                    <Save size={14} className="sm:w-[18px] sm:h-[18px]" /> Save Details
                                </button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="flex-1 bg-[#0f172a] hover:bg-gray-800 border border-gray-700 text-white py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition">
                                    Edit Task
                                </button>
                            )
                        )}

                        {isAssignee && task.assignmentStatus === 'Accepted' && task.status !== 'Merged' && (
                            <button
                                onClick={() => navigate(`/task/${task._id}/work`)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition"
                            >
                                <Play size={14} className="sm:w-[18px] sm:h-[18px]" /> Go to Work Page
                            </button>
                        )}
                    </div>

                    {/* --- DETAILS GRID --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 bg-[#0f172a]/30 p-3 sm:p-4 rounded-xl border border-gray-800">
                        <div>
                            <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Assignee</label>
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-700 flex items-center justify-center text-white text-[9px] sm:text-[10px] shrink-0">
                                    {task.assignedTo?.name?.charAt(0) || <User size={10} className="sm:w-3 sm:h-3" />}
                                </div>
                                <span className={`text-xs sm:text-sm font-medium ${assigneeInfo.color} truncate`}>
                                    {assigneeInfo.text}
                                </span>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Priority</label>
                            {isEditing ? (
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full bg-[#1e293b] border border-gray-600 rounded p-1 text-white text-[10px] sm:text-xs focus:border-indigo-500 outline-none"
                                >
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                </select>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Flag size={12} className={`sm:w-3.5 sm:h-3.5 ${task.priority === 'High' ? 'text-red-500' : task.priority === 'Medium' ? 'text-amber-500' : 'text-blue-500'}`} />
                                    <span className="text-xs sm:text-sm text-gray-300">{task.priority}</span>
                                </div>
                            )}
                        </div>

                        <div className="col-span-1 sm:col-span-2">
                            <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Due Date</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    className="w-full bg-[#1e293b] border border-gray-600 rounded p-1.5 sm:p-2 text-white text-[10px] sm:text-sm focus:border-indigo-500 outline-none"
                                />
                            ) : (
                                <div className="flex items-center gap-2 text-gray-300">
                                    <Calendar size={14} className="text-gray-500 sm:w-4 sm:h-4" />
                                    <span className="text-xs sm:text-sm">
                                        {task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'No Deadline Set'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* --- DESCRIPTION --- */}
                    <div>
                        <label className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Description</label>
                        {isEditing ? (
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded p-2.5 sm:p-3 text-xs sm:text-sm text-white min-h-[100px] sm:min-h-[120px] focus:border-indigo-500 outline-none resize-none leading-relaxed"
                            />
                        ) : (
                            <div className="bg-[#0f172a]/50 rounded-xl p-3 sm:p-4 border border-gray-700/50">
                                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                    {task.description || "No description provided."}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* --- SUBMISSION HISTORY & AI REVIEW --- */}
                    {latestAIReview && (
                        <div className="border border-indigo-500/30 rounded-xl overflow-hidden relative bg-[#0f172a]">
                            <div className="bg-indigo-600/10 p-3 sm:p-4 border-b border-indigo-500/20 flex items-center gap-2">
                                <div className="bg-indigo-50 p-1 rounded text-indigo-600 shadow-[0_0_10px_#6366f1]"><CheckCircle size={12} className="sm:w-3.5 sm:h-3.5" /></div>
                                <h3 className="text-white font-semibold text-xs sm:text-sm">Latest AI Quality Review</h3>
                            </div>
                            <div className="p-3 sm:p-4">
                                <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                                    <span className={`text-lg sm:text-2xl font-bold ${latestAIReview.score > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {latestAIReview.score}/100
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wider">Quality Score</span>
                                </div>
                                <p className="text-[10px] sm:text-xs text-gray-300 leading-relaxed">
                                    {latestAIReview.feedback || "No feedback available."}
                                </p>
                            </div>
                        </div>
                    )}

                    {submissions.length > 0 && (
                        <div className="space-y-2 sm:space-y-3 pt-4 border-t border-gray-800">
                            <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                <FileText size={12} className="sm:w-3.5 sm:h-3.5" /> Submission Assets
                            </h3>
                            {submissions.slice(0, 5).map((sub) => (
                                <div key={sub._id} className="flex justify-between items-center text-[10px] sm:text-xs bg-gray-800/50 p-2.5 sm:p-3 rounded-lg group">
                                    <div className="flex items-center gap-2">
                                        <ExternalLink size={10} className="sm:w-3 sm:h-3 text-cyan-400 shrink-0" />
                                        <span className="text-gray-300 truncate max-w-[120px] sm:max-w-[200px]">
                                            {sub.contentUrl ? 'Link Submission' : 'File Upload'}
                                        </span>
                                    </div>
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded border ${sub.status === 'Approved' ? 'text-emerald-400 border-emerald-500/20' :
                                        sub.status === 'Rejected' ? 'text-red-400 border-red-500/20' : 'text-yellow-400 border-yellow-500/20'
                                        }`}>{sub.status}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- TASK COMMENTS SECTION --- */}
                    <div className="pt-4 sm:pt-6 border-t border-gray-800 pb-6 sm:pb-10">
                        <h3 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4 flex items-center gap-2">
                            <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5" /> Discussion ({comments.length})
                        </h3>

                        {/* Comments List */}
                        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                            {comments.length === 0 ? (
                                <p className="text-[10px] sm:text-xs text-gray-500 italic text-center py-3 sm:py-4 bg-[#0f172a]/30 rounded-lg border border-gray-800/50">
                                    No comments yet. Start the discussion!
                                </p>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-2 sm:gap-3">
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex shrink-0 items-center justify-center text-white text-[10px] sm:text-xs overflow-hidden border border-gray-600">
                                            {comment.user?.avatar ? (
                                                <img src={comment.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                comment.user?.name?.charAt(0) || 'U'
                                            )}
                                        </div>
                                        <div className="flex-1 bg-[#0f172a] p-2.5 sm:p-3 rounded-lg rounded-tl-none border border-gray-700/50">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <span className="text-[10px] sm:text-xs font-bold text-gray-300">{comment.user?.name || 'Unknown User'}</span>
                                                    <span className="text-[8px] sm:text-[10px] text-gray-500">
                                                        {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                {(comment.user?._id === user?._id || comment.user === user?._id) && (
                                                    <button
                                                        onClick={() => handleDeleteComment(comment._id)}
                                                        className="text-gray-500 hover:text-red-400 transition ml-2"
                                                        title="Delete Comment"
                                                    >
                                                        <Trash2 size={10} className="sm:w-3 sm:h-3" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-xs sm:text-sm text-gray-400 whitespace-pre-wrap">{comment.text}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Add Comment Input */}
                        <form onSubmit={handleAddComment} className="flex gap-1.5 sm:gap-2 pb-6 sm:pb-0">
                            <input
                                type="text"
                                placeholder="Type a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="flex-1 bg-[#0f172a] border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none transition"
                            />
                            <button
                                type="submit"
                                disabled={!newComment.trim() || isSubmittingComment}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 sm:px-4 rounded-lg transition flex items-center justify-center shrink-0"
                            >
                                <Send size={14} className="sm:w-4 sm:h-4" />
                            </button>
                        </form>
                    </div>

                </div>
            </div>
        </>
    );
};

export default TaskDetailPanel;