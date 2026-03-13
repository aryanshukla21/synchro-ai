import { Activity, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const ActivityLog = ({ activities }) => {
    const { id } = useParams(); // Get projectId from the route params

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700 overflow-hidden flex flex-col h-[400px]">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center bg-[#1e293b]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Activity size={18} className="text-indigo-400" /> Recent Activity
                </h3>
                {id && (
                    <Link to={`/project/${id}/audit-log`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition">
                        View Full Log <ExternalLink size={14} />
                    </Link>
                )}
            </div>
            <div className="p-5 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                {activities.slice(0, 10).map((act) => (
                    <div key={act._id} className="flex gap-4 relative group">
                        <div className="absolute left-5 top-8 bottom-[-24px] w-0.5 bg-gray-800 group-last:hidden"></div>
                        <div className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden shadow-sm z-10">
                            {act.user?.avatar ?
                                <img src={act.user.avatar} alt="" className="w-full h-full object-cover" /> :
                                <span className="text-xs font-bold text-indigo-400">{act.user?.name?.charAt(0) || '?'}</span>
                            }
                        </div>
                        <div className="pt-1">
                            <p className="text-sm text-gray-300">
                                <span className="font-bold text-white">{act.user?.name || 'Unknown User'}</span> {act.action}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {activities.length === 0 && (
                    <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                        <Activity size={32} className="opacity-20" />
                        <p>No recent activity recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;