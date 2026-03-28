import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';

const MembersTab = ({ projectId }) => {
    const { user } = useAuth();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('Member');

    const [members, setMembers] = useState([
        { id: user?._id, name: user?.name, email: user?.email, role: 'Owner' }
    ]);

    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return showToast('Please enter an email address', 'error');

        setIsLoading(true);
        try {
            await api.post('/workspace/invite', {
                email: inviteEmail,
                role: inviteRole,
                workspaceId: projectId
            });

            showToast(`Invitation sent to ${inviteEmail} as ${inviteRole}`, 'success');
            setInviteEmail('');
            setInviteRole('Member');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to send invite', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Invite to Workspace</h2>
                <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-[#0f172a] border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-500 transition"
                    />
                    <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                            className="flex-1 sm:flex-none bg-[#0f172a] border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base text-white outline-none focus:border-indigo-500 transition"
                        >
                            <option value="Admin">Admin</option>
                            <option value="Member">Member</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition disabled:opacity-50"
                        >
                            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Invite
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Manage Access</h2>
                <div className="border border-gray-700 rounded-xl overflow-hidden">
                    {members.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-700 last:border-0 hover:bg-[#0f172a]/50 transition gap-2 sm:gap-4">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                                    {member.name?.charAt(0) || 'U'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-xs sm:text-sm text-gray-200 truncate">{member.name}</p>
                                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                                <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${member.role === 'Owner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                                    {member.role}
                                </span>
                                {member.role !== 'Owner' && (
                                    <button className="text-gray-500 hover:text-red-400 transition p-1">
                                        <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MembersTab;