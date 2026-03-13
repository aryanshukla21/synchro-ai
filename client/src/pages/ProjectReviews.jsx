import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ExternalLink, FileText, ArrowLeft, Clock, Loader2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';

const ProjectReviews = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchSubmissions();
    }, [projectId]);

    const fetchSubmissions = async () => {
        try {
            const { data } = await api.get(`/submissions/project/${projectId}`);
            // Filter out already rejected items if they still show up
            const pending = data.data.filter(s => s.status !== 'Rejected' && s.task?.status === 'Review-Requested');
            setSubmissions(pending);
        } catch (error) {
            showToast('Failed to load pending reviews', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (submissionId, action) => {
        setProcessingId(submissionId);
        try {
            const { data } = await api.post(`/submissions/${submissionId}/${action}`);

            // Extract the PR URL from the backend response
            const prUrl = data?.data?.githubPrUrl;

            // Remove the handled submission from the list immediately for snappy UI
            setSubmissions(prev => prev.filter(sub => sub._id !== submissionId));

            // Show dynamic success notifications
            if (action === 'merge') {
                showToast('Work successfully approved and merged!', 'success');

                // If a PR was generated, notify the manager
                if (prUrl) {
                    showToast(`GitHub PR Created automatically!`, 'info');
                    // OPTIONAL: Auto-open the PR in a new tab
                    // window.open(prUrl, '_blank'); 
                }
            } else {
                showToast('Work successfully rejected and sent back', 'success');
            }
        } catch (error) {
            showToast(error.response?.data?.message || `Failed to ${action} work`, 'error');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return (
        <div className="p-10 text-center text-white flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className="text-gray-400">Loading pending reviews...</p>
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
            <header className="mb-8 flex items-center justify-between animate-in fade-in duration-300">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4">
                        <ArrowLeft size={20} /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-white">Pending Approvals</h1>
                    <p className="text-gray-400 mt-2">Review and manage submitted work for this project.</p>
                </div>
                <div className="bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                    <Clock size={20} />
                    {submissions.length} Pending
                </div>
            </header>

            {submissions.length === 0 ? (
                <div className="bg-[#1e293b] border border-gray-700 rounded-2xl p-10 text-center animate-in zoom-in-95 duration-300">
                    <CheckCircle className="mx-auto text-emerald-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-white">All caught up!</h2>
                    <p className="text-gray-400">There are no pending submissions awaiting your review.</p>
                </div>
            ) : (
                <div className="bg-[#1e293b] border border-gray-700 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800 border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                                <th className="p-4">Task</th>
                                <th className="p-4">Submitted By</th>
                                <th className="p-4">Evidence / Content</th>
                                <th className="p-4">Comments</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {submissions.map((sub) => (
                                <tr key={sub._id} className="hover:bg-[#0f172a]/50 transition group">
                                    <td className="p-4">
                                        <p className="font-bold text-white">{sub.task?.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {new Date(sub.createdAt).toLocaleDateString()}
                                        </p>
                                    </td>
                                    <td className="p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden">
                                            {sub.submittedBy?.avatar ? (
                                                <img src={sub.submittedBy.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                sub.submittedBy?.name?.charAt(0) || '?'
                                            )}
                                        </div>
                                        <span className="text-gray-300 text-sm">{sub.submittedBy?.name}</span>
                                    </td>
                                    <td className="p-4">
                                        <a
                                            href={sub.contentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition text-sm font-medium"
                                        >
                                            {sub.contentUrl?.includes('cloudinary') ? <FileText size={16} /> : <ExternalLink size={16} />}
                                            View Attached Work
                                        </a>
                                    </td>
                                    <td className="p-4 text-sm text-gray-400 max-w-xs truncate">
                                        {sub.comment || 'No comments provided.'}
                                    </td>
                                    <td className="p-4 text-right flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleAction(sub._id, 'merge')}
                                            disabled={processingId !== null}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 min-w-[110px] justify-center"
                                        >
                                            {processingId === sub._id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                                            {processingId === sub._id ? 'Merging...' : 'Approve'}
                                        </button>
                                        <button
                                            onClick={() => handleAction(sub._id, 'reject')}
                                            disabled={processingId !== null}
                                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition disabled:opacity-50 min-w-[100px] justify-center"
                                        >
                                            {processingId === sub._id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                                            {processingId === sub._id ? 'Rejecting...' : 'Reject'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProjectReviews;