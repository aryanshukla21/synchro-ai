import { useState } from 'react';
import { X, UserPlus, Shield, Trash2, Mail } from 'lucide-react';

const ManageTeamModal = ({ isOpen, onClose, members, currentUser, isOwner, onRemoveMember, onInvite }) => {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Contributor');

    if (!isOpen) return null;

    const handleInvite = async (e) => {
        e.preventDefault();
        await onInvite(email, role);
        setEmail('');
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-[#1e293b] rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <UserPlus className="text-indigo-400" size={24} />
                        Manage Team
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                </div>

                {/* Invite Section */}
                <div className="p-6 bg-gray-800/30 border-b border-gray-700">
                    <form onSubmit={handleInvite} className="flex gap-2">
                        <input
                            type="email"
                            placeholder="User Email"
                            className="flex-1 bg-[#0f172a] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="bg-[#0f172a] border border-gray-600 rounded-lg px-2 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        >
                            <option value="Contributor">Contributor</option>
                            <option value="Viewer">Viewer</option>
                            <option value="Co-Owner">Co-Owner</option>
                        </select>
                        <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition">
                            Invite
                        </button>
                    </form>
                </div>

                {/* Member List */}
                <div className="max-h-80 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {members.map((member) => (
                        <div key={member.user._id} className="flex items-center justify-between bg-[#0f172a]/40 p-3 rounded-xl border border-gray-800">
                            <div className="flex items-center gap-3 min-w-0">
                                {/* FIXED: Avatar logic - Strictly first letter */}
                                <div className="w-9 h-9 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm shrink-0">
                                    {member.user.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-200 font-semibold truncate">{member.user.name}</p>
                                    <div className="flex items-center gap-1.5">
                                        {member.role === 'Co-Owner' && <Shield size={10} className="text-amber-400" />}
                                        <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{member.role} • {member.status}</p>
                                    </div>
                                </div>
                            </div>

                            {isOwner && member.user._id !== currentUser?._id && (
                                <button
                                    onClick={() => onRemoveMember(member.user._id)}
                                    className="p-2 text-gray-500 hover:text-red-400 transition hover:bg-red-400/10 rounded-lg"
                                >
                                    <Trash2 size={16} />
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