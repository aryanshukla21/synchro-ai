import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { Search, Folder, CheckSquare, Users, MessageSquare, Loader2 } from 'lucide-react';

const GlobalSearch = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState({ projects: [], tasks: [], users: [], comments: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!query) return;

        const fetchResults = async () => {
            setLoading(true);
            try {
                const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
                setResults(data.data);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    if (!query) {
        return (
            <div className="p-6 sm:p-8 text-center text-gray-400 mt-10">
                <Search className="mx-auto mb-4 opacity-30" size={40} />
                <h2 className="text-lg sm:text-xl px-4">Enter a search term in the navbar to begin.</h2>
            </div>
        );
    }

    const hasResults = results.projects.length > 0 || results.tasks.length > 0 || results.users.length > 0 || results.comments.length > 0;

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
            <h1 className="text-lg sm:text-2xl font-bold text-white mb-6 flex items-center gap-2 sm:gap-3 truncate">
                <Search className="text-indigo-400 shrink-0" size={20} />
                <span className="truncate">Search Results for <span className="text-indigo-400">"{query}"</span></span>
            </h1>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <Loader2 className="animate-spin mb-4 text-indigo-500" size={32} />
                    <p className="text-sm">Scouring workspace...</p>
                </div>
            ) : !hasResults ? (
                <div className="bg-[#1e293b] border border-gray-700 rounded-xl p-8 sm:p-12 text-center text-gray-400">
                    <p className="text-sm sm:text-lg">No matches found across projects, tasks, or users.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">

                    {/* Tasks Section */}
                    {results.tasks.length > 0 && (
                        <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <CheckSquare size={18} className="text-emerald-400" /> Matching Tasks
                            </h2>
                            <div className="space-y-3">
                                {results.tasks.map(task => (
                                    <Link key={task._id} to={`/project/${task.project?._id}`} className="block p-3 sm:p-4 bg-[#0f172a] rounded-lg border border-gray-600 hover:border-emerald-500/50 transition">
                                        <p className="text-sm sm:text-base text-white font-medium truncate">{task.title}</p>
                                        <div className="flex flex-wrap gap-2 mt-2 text-[10px] sm:text-xs">
                                            <span className="px-2 py-1 bg-gray-800 rounded-md text-gray-400 truncate max-w-[150px]">{task.project?.title || 'Unknown Project'}</span>
                                            <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded-md capitalize">{task.status.replace('-', ' ')}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects Section */}
                    {results.projects.length > 0 && (
                        <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Folder size={18} className="text-blue-400" /> Matching Projects
                            </h2>
                            <div className="space-y-3">
                                {results.projects.map(project => (
                                    <Link key={project._id} to={`/project/${project._id}`} className="block p-3 sm:p-4 bg-[#0f172a] rounded-lg border border-gray-600 hover:border-blue-500/50 transition">
                                        <p className="text-sm sm:text-base text-white font-medium truncate">{project.title}</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-1">{project.description}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* People Section */}
                    {results.users.length > 0 && (
                        <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Users size={18} className="text-purple-400" /> People
                            </h2>
                            <div className="space-y-3">
                                {results.users.map(user => (
                                    <div key={user._id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-[#0f172a] rounded-lg border border-gray-600">
                                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold overflow-hidden shrink-0">
                                            {user.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm sm:text-base text-white font-medium truncate">{user.name}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                    {results.comments.length > 0 && (
                        <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-4 sm:p-6">
                            <h2 className="text-base sm:text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <MessageSquare size={18} className="text-amber-400" /> Matching Comments
                            </h2>
                            <div className="space-y-3">
                                {results.comments.map(comment => (
                                    <div key={comment._id} className="p-3 sm:p-4 bg-[#0f172a] rounded-lg border border-gray-600">
                                        <p className="text-gray-300 text-xs sm:text-sm line-clamp-2">"{comment.text}"</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500 mt-2 truncate">On task: <span className="text-indigo-400">{comment.task?.title || 'Unknown'}</span></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;