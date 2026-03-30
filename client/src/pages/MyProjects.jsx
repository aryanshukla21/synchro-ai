import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { Folder, Shield, PenTool, Eye, ExternalLink, ChevronDown } from 'lucide-react';

const MyProjects = () => {
    const { isSidebarOpen, setIsSidebarOpen } = useOutletContext();
    const { user } = useAuth();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- NEW: PAGINATION STATE ---
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [paginationMeta, setPaginationMeta] = useState(null);

    const fetchProjects = async (pageNumber = 1) => {
        try {
            if (pageNumber === 1) setLoading(true);
            else setLoadingMore(true);

            const { data } = await api.get(`/projects?page=${pageNumber}&limit=20`);

            if (pageNumber === 1) {
                setProjects(data.data);
            } else {
                setProjects(prev => [...prev, ...data.data]);
            }
            setPaginationMeta(data.pagination);
        } catch (error) {
            console.error("Failed to load projects", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchProjects(1);
    }, []);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProjects(nextPage);
    };

    const getMyRole = (project) => {
        if (project.owner._id === user?._id) return 'Owner';
        const member = project.members.find(m => m.user?._id === user?._id);
        return member ? member.role : 'Viewer';
    };

    const categories = {
        Owned: projects.filter(p => getMyRole(p) === 'Owner'),
        'Co-Owned': projects.filter(p => getMyRole(p) === 'Co-Owner'),
        Contributor: projects.filter(p => getMyRole(p) === 'Contributor'),
        Viewer: projects.filter(p => getMyRole(p) === 'Viewer'),
    };

    const categoryConfig = {
        Owned: { icon: Folder, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
        'Co-Owned': { icon: Shield, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
        Contributor: { icon: PenTool, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
        Viewer: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-600/30' },
    };

    if (loading) return <div className="p-10 text-white animate-pulse">Loading Projects...</div>;

    return (
        <div className="flex flex-col h-screen bg-[#0f172a] text-gray-300 overflow-hidden font-sans">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-[#0f172a] shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Duplicate Mobile Menu Button Removed */}
                    <h1 className="text-lg sm:text-xl font-bold text-white">My Projects</h1>
                </div>
            </div>

            {/* 2x2 Grid Layout */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 max-w-7xl mx-auto min-h-[600px] mb-20">
                    {Object.keys(categories).map((key) => {
                        const Config = categoryConfig[key];
                        const Icon = Config.icon;
                        const list = categories[key];

                        return (
                            <div key={key} className={`flex flex-col rounded-xl border ${Config.border} ${Config.bg} overflow-hidden shadow-xl max-h-[400px] sm:max-h-[500px]`}>
                                {/* Card Header */}
                                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700/50 flex justify-between items-center bg-[#0f172a]/40 backdrop-blur">
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Icon size={18} className={`sm:w-5 sm:h-5 ${Config.color}`} />
                                        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide uppercase">{key}</h2>
                                    </div>
                                    <span className="bg-[#0f172a] text-white text-xs font-bold px-2.5 sm:px-3 py-1 rounded-full border border-gray-700">
                                        {list.length}
                                    </span>
                                </div>

                                {/* Project List */}
                                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar">
                                    {list.length > 0 ? (
                                        list.map(project => (
                                            <Link to={`/project/${project._id}`} key={project._id} className="block group relative">
                                                <div className="bg-[#1e293b] border border-gray-700 hover:border-indigo-500 rounded-lg p-3 sm:p-4 transition-all hover:translate-x-1 hover:shadow-lg">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <h3 className="text-sm sm:text-base text-white font-bold group-hover:text-indigo-400 transition truncate">
                                                                {project.title}
                                                            </h3>
                                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1 truncate">{project.description || 'No description'}</p>
                                                        </div>
                                                        <ExternalLink size={14} className="text-gray-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition shrink-0 mt-1" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50 min-h-[100px]">
                                            <p className="text-xs sm:text-sm italic">No {key} projects</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- LOAD MORE --- */}
                {paginationMeta && paginationMeta.page < paginationMeta.totalPages && (
                    <div className="flex justify-center pb-10">
                        <button
                            onClick={handleLoadMore}
                            disabled={loadingMore}
                            className="bg-[#1e293b] hover:bg-gray-800 border border-gray-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-bold flex items-center gap-2 transition shadow-lg disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading...' : <><ChevronDown size={16} /> Load More</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProjects;