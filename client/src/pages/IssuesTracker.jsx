import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';
import {
    Bug, Search, Plus, Loader2, X,
    AlertOctagon, ChevronRight
} from 'lucide-react';

const IssuesTracker = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [issues, setIssues] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newBug, setNewBug] = useState({
        title: '', description: '', stepsToReproduce: '',
        environment: 'Development', severity: 'Medium', assignedTo: '',
        priority: 'High', type: 'Bug'
    });

    useEffect(() => { fetchData(); }, [projectId]);

    const fetchData = async () => {
        try {
            const [projectRes, tasksRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/task/project/${projectId}?limit=1000`)
            ]);
            setProject(projectRes.data.data);
            const allTasks = tasksRes.data.data || [];
            setIssues(allTasks.filter(t => t.type === 'Bug'));
        } catch (error) {
            showToast("Failed to load issues", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleReportBug = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...newBug, projectId };
            if (!payload.assignedTo) payload.assignedTo = null;

            const { data } = await api.post('/task', payload);
            setIssues([data.data, ...issues]);
            setShowModal(false);
            setNewBug({
                title: '', description: '', stepsToReproduce: '',
                environment: 'Development', severity: 'Medium', assignedTo: '',
                priority: 'High', type: 'Bug'
            });
            showToast("Bug reported successfully", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to report bug", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredIssues = issues.filter(issue =>
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.environment?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getSeverityBadge = (severity) => {
        const styles = {
            'Critical': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            'High': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            'Medium': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Low': 'bg-gray-700/50 text-gray-400 border-gray-600'
        };
        return <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border ${styles[severity] || styles['Medium']}`}>{severity}</span>;
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0f172a] text-white">
            <Loader2 className="animate-spin text-rose-500 mb-4" size={32} />
            <p className="text-gray-400 text-sm">Loading Issue Tracker...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">
            <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800 bg-[#0f172a] shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                    {/* REMOVED MENU BUTTON HERE */}
                    <Link to={`/project/${projectId}`} className="hover:text-white transition truncate max-w-[120px] sm:max-w-none">{project?.title}</Link>
                    <ChevronRight size={14} className="shrink-0" />
                    <span className="text-white font-medium truncate">Issues Tracker</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <Bug className="text-rose-500" size={20} /> Bug & Issue Tracker
                    </h1>

                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 sm:top-2 text-gray-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search bugs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1e293b] border border-gray-700 rounded-lg py-1.5 sm:py-2 pl-8 pr-3 text-xs sm:text-sm focus:outline-none focus:border-rose-500 text-white transition"
                            />
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 transition whitespace-nowrap"
                        >
                            <Plus size={14} /> Report Bug
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-xl max-w-7xl mx-auto">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[750px]">
                            <thead>
                                <tr className="bg-gray-800/80 border-b border-gray-700 text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">
                                    <th className="p-3 sm:p-4 font-medium w-[250px] sm:w-[300px]">Issue Title</th>
                                    <th className="p-3 sm:p-4 font-medium text-center">Severity</th>
                                    <th className="p-3 sm:p-4 font-medium text-center">Environment</th>
                                    <th className="p-3 sm:p-4 font-medium text-center">Status</th>
                                    <th className="p-3 sm:p-4 font-medium">Assignee</th>
                                    <th className="p-3 sm:p-4 font-medium">Reported</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50 text-xs sm:text-sm">
                                {filteredIssues.map(issue => (
                                    <tr key={issue._id} className="hover:bg-[#0f172a]/50 transition group">
                                        <td className="p-3 sm:p-4">
                                            <Link to={`/task/${issue._id}/work`} className="font-medium text-gray-200 group-hover:text-rose-400 transition block truncate pr-2">
                                                {issue.title}
                                            </Link>
                                        </td>
                                        <td className="p-3 sm:p-4 text-center">
                                            {getSeverityBadge(issue.severity)}
                                        </td>
                                        <td className="p-3 sm:p-4 text-center">
                                            <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-gray-700">
                                                {issue.environment || 'Development'}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4 text-center">
                                            <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-bold uppercase tracking-wider border whitespace-nowrap ${issue.status === 'Merged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                issue.status === 'Review-Requested' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                    'bg-gray-800 text-gray-400 border-gray-600'
                                                }`}>
                                                {issue.status.replace('-', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold text-[9px] sm:text-[10px] overflow-hidden shrink-0">
                                                    {issue.assignedTo?.avatar ? <img src={issue.assignedTo.avatar} alt="avatar" className="w-full h-full object-cover" /> : issue.assignedTo?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-[10px] sm:text-xs text-gray-400 truncate w-16 sm:w-24">{issue.assignedTo?.name || 'Unassigned'}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-[10px] sm:text-xs text-gray-500">
                                            {new Date(issue.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {filteredIssues.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="p-8 sm:p-12 text-center text-gray-500">
                                            <AlertOctagon size={40} className="mx-auto mb-3 opacity-20 text-rose-500" />
                                            <p className="text-base sm:text-lg text-white mb-1">No bugs found.</p>
                                            <p className="text-xs sm:text-sm">Your codebase is clean (or you need to adjust your search)!</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* REPORT BUG MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-5 sm:p-6 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
                        <div className="flex justify-between items-center mb-5 sm:mb-6">
                            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                                <Bug className="text-rose-500" size={18} /> Report a Bug
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleReportBug} className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 block">Issue Title *</label>
                                <input required type="text" value={newBug.title} onChange={e => setNewBug({ ...newBug, title: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none transition" placeholder="e.g. Login button unresponsive on mobile" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 block">Environment</label>
                                    <select value={newBug.environment} onChange={e => setNewBug({ ...newBug, environment: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none transition">
                                        <option value="Development">Development</option>
                                        <option value="Staging">Staging</option>
                                        <option value="Production">Production</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 block">Severity</label>
                                    <select value={newBug.severity} onChange={e => setNewBug({ ...newBug, severity: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none transition">
                                        <option value="Low">Low (Minor UI tweak)</option>
                                        <option value="Medium">Medium (Functional but has workaround)</option>
                                        <option value="High">High (Feature broken)</option>
                                        <option value="Critical">Critical (System crash / Data loss)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 block">Assign To (Optional)</label>
                                <select value={newBug.assignedTo} onChange={e => setNewBug({ ...newBug, assignedTo: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-white focus:border-rose-500 focus:outline-none transition">
                                    <option value="">Unassigned</option>
                                    {project?.members?.map(m => (
                                        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 block">Steps to Reproduce *</label>
                                <textarea required value={newBug.stepsToReproduce} onChange={e => setNewBug({ ...newBug, stepsToReproduce: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-white h-20 sm:h-24 focus:border-rose-500 focus:outline-none resize-none transition" placeholder="1. Go to homepage&#10;2. Click on...&#10;3. Observe error..."></textarea>
                            </div>

                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-400 mb-1 block">Expected vs Actual Behavior</label>
                                <textarea value={newBug.description} onChange={e => setNewBug({ ...newBug, description: e.target.value })} className="w-full bg-[#0f172a] border border-gray-600 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm text-white h-16 sm:h-20 focus:border-rose-500 focus:outline-none resize-none transition" placeholder="Additional details, error codes, or context..."></textarea>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                                <button type="button" onClick={() => setShowModal(false)} className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition font-medium">Cancel</button>
                                <button type="submit" disabled={isSubmitting} className="px-4 sm:px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs sm:text-sm font-bold transition shadow-lg shadow-rose-900/20 disabled:opacity-50 flex items-center gap-1.5 sm:gap-2">
                                    {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                                    Submit Issue
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IssuesTracker;