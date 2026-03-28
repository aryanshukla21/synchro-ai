import { Users, UserPlus } from 'lucide-react';

const TeamMembersCard = ({ activeMembers, onManageTeamClick }) => {
    return (
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700 p-5 sm:p-6 shadow-xl">
            <div className="flex justify-between items-center mb-5 sm:mb-6">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-base">
                    <Users size={16} className="sm:w-[18px] sm:h-[18px] text-indigo-400 shrink-0" /> Team
                </h3>
                <button
                    onClick={onManageTeamClick}
                    className="p-1.5 sm:p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-indigo-400 transition"
                >
                    <UserPlus size={14} className="sm:w-4 sm:h-4" />
                </button>
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {activeMembers.map((member) => (
                    <div key={member.user._id} className="flex items-center justify-between group bg-[#0f172a]/30 sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            {member.user.avatar ? (
                                <img src={member.user.avatar} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-600 shrink-0" alt="" />
                            ) : (
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-[10px] sm:text-xs font-bold shrink-0">
                                    {member.user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm text-gray-200 font-medium truncate">{member.user.name}</p>
                                <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-wider truncate">{member.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TeamMembersCard;