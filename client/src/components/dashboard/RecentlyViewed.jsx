import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Folder, Loader2 } from 'lucide-react';
import api from '../../api/axios';

const RecentlyViewed = () => {
    const [recentProjects, setRecentProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecent = async () => {
            try {
                const { data } = await api.get('/projects/recent');
                setRecentProjects(data.data);
            } catch (error) {
                console.error("Failed to fetch recent projects:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRecent();
    }, []);

    if (loading) {
        return (
            <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-6 flex items-center justify-center h-32 sm:h-40 mt-4 sm:mt-6 shadow-sm">
                <Loader2 className="animate-spin text-indigo-500 sm:w-8 sm:h-8" size={28} />
            </div>
        );
    }

    if (recentProjects.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 sm:mt-8 mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 px-1">
                <Clock size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-400" /> Jump Back In
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {recentProjects.map((project) => (
                    <Link
                        key={project._id}
                        to={`/project/${project._id}`}
                        className="group bg-[#1e293b] rounded-xl border border-gray-700 p-3 sm:p-4 hover:border-indigo-500/50 hover:bg-[#1e293b]/80 shadow-sm transition-all flex flex-col h-28 sm:h-32"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                                <Folder size={14} className="sm:w-4 sm:h-4" />
                            </div>
                            <span className="text-[9px] sm:text-[10px] text-gray-500 font-medium bg-[#0f172a] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-gray-800">
                                {new Date(project.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <h4 className="text-white font-medium text-xs sm:text-sm mb-1 truncate group-hover:text-indigo-300 transition-colors">
                            {project.title}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-1 mt-auto truncate">
                            {project.status ? project.status.replace('-', ' ') : 'Active'}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;