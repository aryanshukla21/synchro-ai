import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import {
    FolderOpen, Image as ImageIcon, FileText, Video,
    Archive, File, Download, ExternalLink, Search,
    ArrowLeft, Loader2, Calendar
} from 'lucide-react';

const ProjectAssets = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [assets, setAssets] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const [projectRes, assetsRes] = await Promise.all([
                    api.get(`/projects/${projectId}`),
                    api.get(`/projects/${projectId}/assets`)
                ]);
                setProject(projectRes.data.data);
                setAssets(assetsRes.data.data || []);
            } catch (error) {
                console.error("Failed to load assets", error);
                showToast("Failed to load project files", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchAssets();
    }, [projectId]);

    const getIconForType = (type, size = 24) => {
        switch (type) {
            case 'image': return <ImageIcon size={size} className="text-blue-400" />;
            case 'pdf': return <FileText size={size} className="text-rose-400" />;
            case 'video': return <Video size={size} className="text-purple-400" />;
            case 'archive': return <Archive size={size} className="text-amber-400" />;
            default: return <File size={size} className="text-gray-400" />;
        }
    };

    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                asset.sourceTitle.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilter === 'all' || asset.type === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [assets, searchQuery, activeFilter]);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0f172a] text-white">
                <Loader2 className="animate-spin text-indigo-500 mb-4 sm:w-10 sm:h-10" size={32} />
                <p className="text-gray-400 text-sm sm:text-base">Compiling asset library...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">
            <header className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-800 bg-[#0f172a] shrink-0 sticky top-0 z-10">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    {/* REMOVED MENU BUTTON HERE */}
                    <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition p-1 bg-[#1e293b] rounded-lg shrink-0">
                        <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2 truncate">
                            <FolderOpen className="text-indigo-500 shrink-0" size={20} />
                            <span className="truncate">Asset Library</span>
                        </h1>
                        <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 truncate">Project: {project?.title || project?.name}</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 sm:gap-4">
                    <div className="flex bg-[#1e293b] p-1 rounded-lg border border-gray-700 w-full sm:w-auto overflow-x-auto no-scrollbar">
                        {['all', 'image', 'pdf', 'video', 'document'].map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveFilter(f)}
                                className={`px-3 sm:px-4 py-1.5 text-[10px] sm:text-xs font-bold rounded-md capitalize transition shrink-0 ${activeFilter === f ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full lg:w-64 shrink-0">
                        <Search className="absolute left-2.5 top-2 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder="Search files or tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#1e293b] border border-gray-700 rounded-lg py-1.5 sm:py-2 pl-7 pr-3 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 text-white transition"
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-700">
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto">
                    {filteredAssets.map(asset => (
                        <div key={asset._id} className="bg-[#1e293b] border border-gray-700 rounded-xl overflow-hidden hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-900/10 transition group flex flex-col">
                            <div className="h-24 sm:h-32 bg-[#0f172a] border-b border-gray-700 flex items-center justify-center relative overflow-hidden group-hover:bg-[#131d33] transition">
                                {asset.type === 'image' ? (
                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-300" />
                                ) : (
                                    <div className="scale-75 sm:scale-100">{getIconForType(asset.type, 48)}</div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3 backdrop-blur-sm">
                                    <a href={asset.url} target="_blank" rel="noopener noreferrer" className="p-1.5 sm:p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition" title="View in Browser">
                                        <ExternalLink size={14} className="sm:w-[18px] sm:h-[18px]" />
                                    </a>
                                    <a href={asset.url} download className="p-1.5 sm:p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition" title="Download File">
                                        <Download size={14} className="sm:w-[18px] sm:h-[18px]" />
                                    </a>
                                </div>
                            </div>
                            <div className="p-3 sm:p-4 flex flex-col flex-1">
                                <h3 className="text-xs sm:text-sm font-bold text-white truncate mb-1" title={asset.name}>{asset.name}</h3>
                                <p className="text-[8px] sm:text-[10px] text-indigo-400 font-medium bg-indigo-500/10 self-start px-1.5 sm:px-2 py-0.5 rounded border border-indigo-500/20 mb-2 sm:mb-3 truncate max-w-full">
                                    {asset.source}
                                </p>
                                <div className="mt-auto space-y-1.5 sm:space-y-2">
                                    <Link to={`/task/${asset.taskId}/work`} className="text-[10px] sm:text-xs text-gray-400 hover:text-indigo-400 truncate block transition" title={`Go to Task: ${asset.sourceTitle}`}>
                                        From: {asset.sourceTitle}
                                    </Link>
                                    <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-gray-700/50">
                                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                                {asset.uploadedBy?.avatar ? (
                                                    <img src={asset.uploadedBy.avatar} alt="uploader" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-[6px] sm:text-[8px] font-bold text-white flex items-center justify-center h-full">
                                                        {asset.uploadedBy?.name?.charAt(0) || '?'}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[8px] sm:text-[10px] text-gray-500 truncate w-12 sm:w-16">{asset.uploadedBy?.name || 'Unknown'}</span>
                                        </div>
                                        <span className="text-[8px] sm:text-[10px] text-gray-500 flex items-center gap-1 shrink-0">
                                            <Calendar size={8} className="sm:w-2.5 sm:h-2.5" /> {new Date(asset.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredAssets.length === 0 && (
                        <div className="col-span-full py-16 sm:py-20 text-center text-gray-500">
                            <FolderOpen size={36} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-20" />
                            <p className="text-base sm:text-lg text-white mb-1">No files found.</p>
                            <p className="text-xs sm:text-sm">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProjectAssets;