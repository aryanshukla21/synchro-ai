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

    // Mock/Fetch existing workspace members
    const [members, setMembers] = useState([
        { id: user?._id, name: user?.name, email: user?.email, role: 'Owner' }
    ]);

    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return showToast('Please enter an email address', 'error');

        setIsLoading(true);
        try {
            // Using the new workspace token route, passing the projectId
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
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-bold text-white mb-4">Invite to Workspace</h2>
                <form onSubmit={handleSendInvite} className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                    />
                    <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                    >
                        <option value="Admin">Admin</option>
                        <option value="Member">Member</option>
                        <option value="Viewer">Viewer</option>
                    </select>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                    >
                        <Plus size={18} /> Send Invite
                    </button>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-bold text-white mb-4">Manage Access</h2>
                <div className="border border-gray-700 rounded-xl overflow-hidden">
                    {members.map((member, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border-b border-gray-700 last:border-0 hover:bg-[#0f172a]/50 transition">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {member.name?.charAt(0) || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-200">{member.name}</p>
                                    <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${member.role === 'Owner' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                                    {member.role}
                                </span>
                                {member.role !== 'Owner' && (
                                    <button className="text-gray-500 hover:text-red-400 transition">
                                        <Trash2 size={18} />
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