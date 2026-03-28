import { Activity, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

const ActivityLog = ({ activities }) => {
    const { id } = useParams();

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700 overflow-hidden flex flex-col h-[350px] sm:h-[400px]">
            <div className="p-4 sm:p-5 border-b border-gray-700 flex justify-between items-center bg-[#1e293b] shrink-0">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5 sm:gap-2 truncate">
                    <Activity size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-400 shrink-0" /> <span className="truncate">Recent Activity</span>
                </h3>
                {id && (
                    <Link to={`/project/${id}/audit-log`} className="text-[10px] sm:text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition shrink-0 ml-2">
                        View Full <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" />
                    </Link>
                )}
            </div>
            <div className="p-4 sm:p-5 space-y-5 sm:space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                {activities.slice(0, 10).map((act) => (
                    <div key={act._id} className="flex gap-3 sm:gap-4 relative group">
                        <div className="absolute left-4 sm:left-5 top-8 bottom-[-20px] sm:bottom-[-24px] w-0.5 bg-gray-800 group-last:hidden"></div>
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden shadow-sm z-10">
                            {act.user?.avatar ?
                                <img src={act.user.avatar} alt="" className="w-full h-full object-cover" /> :
                                <span className="text-[10px] sm:text-xs font-bold text-indigo-400">{act.user?.name?.charAt(0) || '?'}</span>
                            }
                        </div>
                        <div className="pt-0.5 sm:pt-1 min-w-0">
                            <p className="text-xs sm:text-sm text-gray-300 leading-snug">
                                <span className="font-bold text-white">{act.user?.name || 'Unknown User'}</span> {act.action}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">{new Date(act.createdAt).toLocaleString()}</p>
                        </div>
                    </div>
                ))}
                {activities.length === 0 && (
                    <div className="text-center py-8 sm:py-10 text-gray-500 flex flex-col items-center gap-2">
                        <Activity size={28} className="sm:w-8 sm:h-8 opacity-20" />
                        <p className="text-xs sm:text-sm">No recent activity recorded.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLog;