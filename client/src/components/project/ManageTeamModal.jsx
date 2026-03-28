import { useState } from 'react';
import { X, UserPlus, Shield, Trash2, Loader2 } from 'lucide-react';

const ManageTeamModal = ({ isOpen, onClose, members, currentUser, isOwner, onRemoveMember, onInvite }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Contributor');
    const [isInviting, setIsInviting] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!email) return;

        setIsInviting(true);
        try {
            await onInvite(email, role);
        } catch (error) {
            console.error("Invite failed");
        } finally {
            setEmail('');
            setIsInviting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
            <div className="bg-[#1e293b] rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden my-8">

                {/* Header */}
                <div className="p-4 sm:p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="text-indigo-400 sm:w-6 sm:h-6" size={20} />
                        Manage Team
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X size={18} className="sm:w-5 sm:h-5" /></button>
                </div>

                {/* Invite Section */}
                <div className="p-4 sm:p-6 bg-gray-800/30 border-b border-gray-700">
                    <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                            type="email"
                            placeholder="User Email"
                            className="flex-1 bg-[#0f172a] border border-gray-600 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none disabled:opacity-50"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isInviting}
                            required
                        />
                        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                disabled={isInviting}
                                className="flex-1 sm:flex-none bg-[#0f172a] border border-gray-600 rounded-lg px-2 py-2 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none disabled:opacity-50"
                            >
                                <option value="Contributor">Contributor</option>
                                <option value="Viewer">Viewer</option>
                                <option value="Co-Owner">Co-Owner</option>
                            </select>
                            <button
                                type="submit"
                                disabled={isInviting}
                                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center min-w-[90px] gap-1.5 sm:gap-2"
                            >
                                {isInviting ? (
                                    <><Loader2 size={14} className="animate-spin" /> Inviting</>
                                ) : (
                                    'Invite'
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Member List */}
                <div className="max-h-64 sm:max-h-80 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {members.map((member) => (
                        <div key={member.user._id} className="flex items-center justify-between bg-[#0f172a]/40 p-2.5 sm:p-3 rounded-xl border border-gray-800">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs sm:text-sm shrink-0">
                                    {member.user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm text-gray-200 font-semibold truncate">{member.user.name}</p>
                                    <div className="flex items-center gap-1.5">
                                        {member.role === 'Co-Owner' && <Shield size={10} className="text-amber-400" />}
                                        <p className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-tighter">{member.role} • {member.status}</p>
                                    </div>
                                </div>
                            </div>

                            {isOwner && member.user._id !== currentUser?._id && (
                                <button
                                    onClick={() => onRemoveMember(member.user._id)}
                                    className="p-1.5 sm:p-2 text-gray-500 hover:text-red-400 transition hover:bg-red-400/10 rounded-lg shrink-0"
                                >
                                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageTeamModal;