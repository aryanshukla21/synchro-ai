import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Search, Calendar, Activity, Loader2, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const ProjectAuditLog = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();

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
            <header className="px-4 sm:px-6 py-4 border-b border-gray-800 bg-[#0f172a] shrink-0 flex flex-col gap-3 sm:gap-4 z-10 sticky top-0">
                <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-1.5 bg-[#1e293b] text-white rounded-lg hover:bg-indigo-600 transition shrink-0">
                        <Menu size={16} />
                    </button>
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition p-1 bg-[#1e293b] rounded-lg shrink-0">
                        <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 truncate">
                            <Activity className="text-indigo-500 shrink-0" size={20} />
                            Audit Log
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">Project: {project?.title || project?.name || 'Loading...'}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-start md:items-center bg-[#1e293b] p-3 sm:p-4 rounded-xl border border-gray-700 shadow-sm w-full">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-2.5 sm:top-2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search actions..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-1.5 sm:py-2 pl-8 pr-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                        />
                    </div>

                    <div className="flex-1 w-full md:min-w-[150px]">
                        <select
                            value={userId}
                            onChange={(e) => { setUserId(e.target.value); setPage(1); }}
                            className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-1.5 sm:py-2 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                        >
                            <option value="">All Users</option>
                            {project?.members.map(m => (
                                <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 flex-[2] w-full md:min-w-[280px]">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-2.5 top-2 text-gray-500" size={14} />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-1.5 sm:py-2 pl-7 pr-2 text-[10px] sm:text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                        <span className="text-gray-500 text-[10px] sm:text-xs">to</span>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-2.5 top-2 text-gray-500" size={14} />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                                className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-1.5 sm:py-2 pl-7 pr-2 text-[10px] sm:text-xs text-white focus:outline-none focus:border-indigo-500 transition"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleClearFilters}
                        className="w-full md:w-auto px-4 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap"
                    >
                        Clear Filters
                    </button>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden shadow-xl max-w-7xl mx-auto flex flex-col h-full min-h-[400px]">
                    <div className="overflow-x-auto custom-scrollbar flex-1">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-800/80 border-b border-gray-700 text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">
                                    <th className="p-3 sm:p-4 font-medium w-[180px] sm:w-[200px]">Date & Time</th>
                                    <th className="p-3 sm:p-4 font-medium w-[200px] sm:w-[250px]">User</th>
                                    <th className="p-3 sm:p-4 font-medium">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50 text-xs sm:text-sm">
                                {loading ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 text-center text-gray-500">
                                            <Loader2 className="animate-spin mx-auto mb-2 text-indigo-500 sm:w-6 sm:h-6" size={20} />
                                            Loading logs...
                                        </td>
                                    </tr>
                                ) : activities.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-8 sm:p-12 text-center text-gray-500">
                                            <Activity className="mx-auto mb-2 opacity-20 sm:w-8 sm:h-8" size={28} />
                                            No activities found matching your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map(act => (
                                        <tr key={act._id} className="hover:bg-[#0f172a]/50 transition">
                                            <td className="p-3 sm:p-4 whitespace-nowrap text-[10px] sm:text-xs text-gray-400">
                                                {new Date(act.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-3 sm:p-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-[9px] sm:text-[10px] overflow-hidden shrink-0">
                                                        {act.user?.avatar ? (
                                                            <img src={act.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                        ) : (
                                                            act.user?.name?.charAt(0) || '?'
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-gray-200 truncate w-32 sm:w-48">
                                                        {act.user?.name || 'Unknown User'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 sm:p-4 text-gray-300 text-xs sm:text-sm leading-relaxed">
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
                        <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-800/30 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 shrink-0">
                            <span className="text-[10px] sm:text-xs text-gray-500">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
                            </span>
                            <div className="flex gap-1.5 sm:gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1 sm:p-1.5 bg-[#0f172a] border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-400 hover:text-white"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#0f172a] border border-gray-600 rounded text-xs sm:text-sm text-white flex items-center justify-center min-w-[28px] sm:min-w-[32px]">
                                    {page}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                    disabled={page === pagination.totalPages}
                                    className="p-1 sm:p-1.5 bg-[#0f172a] border border-gray-600 rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-gray-400 hover:text-white"
                                >
                                    <ChevronRight size={16} />
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