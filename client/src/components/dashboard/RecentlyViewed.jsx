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
            <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-6 flex items-center justify-center h-40 mt-6 shadow-sm">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
            </div>
        );
    }

    if (recentProjects.length === 0) {
        return null; // Hide the section entirely if the user is brand new and has no history
    }

    return (
        <div className="mt-8 mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4 px-1">
                <Clock size={18} className="text-indigo-400" /> Jump Back In
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {recentProjects.map((project) => (
                    <Link
                        key={project._id}
                        to={`/project/${project._id}`}
                        className="group bg-[#1e293b] rounded-xl border border-gray-700 p-4 hover:border-indigo-500/50 hover:bg-[#1e293b]/80 shadow-sm transition-all flex flex-col h-32"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform shrink-0">
                                <Folder size={16} />
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium bg-[#0f172a] px-2 py-1 rounded-md border border-gray-800">
                                {new Date(project.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <h4 className="text-white font-medium text-sm mb-1 truncate group-hover:text-indigo-300 transition-colors">
                            {project.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-auto">
                            {project.status ? project.status.replace('-', ' ') : 'Active'}
                        </p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;