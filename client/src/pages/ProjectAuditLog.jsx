// client/src/pages/ProjectAuditLog.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Search, Calendar, Activity, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const ProjectAuditLog = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);

    // Filters & Pagination state
    const [search, setSearch] = useState('');
    const [userId, setUserId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 20 });

    useEffect(() => {
        fetchProjectData();
    }, [projectId]);

    useEffect(() => {
        fetchActivities();
    }, [projectId, page, search, userId, startDate, endDate]);

    const fetchProjectData = async () => {
        try {
            const { data } = await api.get(`/projects/${projectId}`);
            setProject(data.data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load project details', 'error');
        }
    };

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: 20,
            });
            if (search) params.append('search', search);
            if (userId) params.append('userId', userId);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const { data } = await api.get(`/activities/project/${projectId}?${params.toString()}`);
            setActivities(data.data);
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error(error);
            showToast('Failed to load activity logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClearFilters = () => {
        setSearch('');
        setUserId('');
        setStartDate('');
        setEndDate('');
        setPage(1);
    };

    return (
        <div className="flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">
            <header className="px-6 py-4 border-b border-gray-800 bg-[#0f172a] shrink-0 flex flex-col gap-4 z-10 sticky top-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-2">
                            <Activity className="text-indigo-500" size={24} />
                            Audit Log
                        </h1>
                        <p className="text-xs text-gray-500">Project: {project?.title || project?.name || 'Loading...'}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-[#1e293b] p-4 rounded-xl border border-gray-700 shadow-sm">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search actions..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                        />
                    </div>

                    <div className="flex-1 w-full min-w-[150px]">
                        <select
                            value={userId}
                            onChange={(e) => { setUserId(e.target.value); setPage(1); }}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                        >
                            <option value="">All Users</option>
                            {project?.members.map(m => (
                                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-[2] w-full min-w-[300px]">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <span className="text-gray-500 text-sm">to</span>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-3 top-2.5 text-gray-500" size={16} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleClearFilters}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-medium rounded-lg transition whitespace-nowrap"
                    >
                        Clear Filters
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-xl max-w-7xl mx-auto">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-800/80 border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="p-4 font-medium w-[200px]">Date & Time</th>
                                    <th className="p-4 font-medium w-[250px]">User</th>
                                    <th className="p-4 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50 text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-500">
                                            <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500" size={24} />
                                            Loading logs...
                                        </td>
                                    </tr>
                                ) : activities.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-500">
                                            <Activity className="mx-auto mb-2 opacity-20" size={32} />
                                            No activities found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map(act => (
                                        <tr key={act._id} className="hover:bg-[#0f172a]/50 transition">
                                            <td className="p-4 whitespace-nowrap text-gray-400">
                                                {new Date(act.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-[10px] overflow-hidden shrink-0">
                                                        {act.user?.avatar ? (
                                                            <img src={act.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            act.user?.name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-200 truncate max-w-[180px]">
                                                        {act.user?.name || 'Unknown User'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300">
                                                {act.action}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {!loading && pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-gray-700 bg-gray-800/30 flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 bg-[#0f172a] border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-400 hover:text-white"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="px-3 py-1 bg-[#0f172a] border border-gray-600 rounded text-sm text-white flex items-center justify-center min-w-[32px]">
                                    {page}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="p-1.5 bg-[#0f172a] border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-400 hover:text-white"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProjectAuditLog;