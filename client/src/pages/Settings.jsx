import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Link as LinkIcon, Bell, ShieldAlert, GitMerge, Loader2, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../hooks/useAuth';

// Tabs
import MembersTab from '../components/settings/MembersTab';
import IntegrationsTab from '../components/settings/IntegrationsTab';
import NotificationsTab from '../components/settings/NotificationsTab';
import WorkflowTab from '../components/settings/WorkflowTab';

// Modals
import DeleteConfirmationModal from '../components/project/DeleteConfirmationModal';

const Settings = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { user } = useAuth(); // Needed to verify if user is the Owner

    const [activeTab, setActiveTab] = useState('members');
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch the project data so the WorkflowTab has the rules it needs to render
    useEffect(() => {
        const fetchProject = async () => {
            try {
                const { data } = await api.get(`/projects/${projectId}`);
                setProject(data.data);
            } catch (error) {
                showToast("Failed to load workspace settings", "error");
            } finally {
                setLoading(false);
            }
        };
        if (projectId) fetchProject();
    }, [projectId]);

    // Handle Project Deletion
    const handleDeleteProject = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/projects/${projectId}`);
            showToast("Workspace deleted successfully", "success");
            setIsDeleteModalOpen(false);
            navigate('/dashboard'); // Redirect to dashboard after deletion
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to delete workspace", "error");
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
        }
    };

    // Render the correct component based on state
    const renderActiveTab = () => {
        if (!project) return null;

        switch (activeTab) {
            case 'members': return <MembersTab projectId={projectId} />;
            case 'workflow': return <WorkflowTab project={project} setProject={setProject} />;
            case 'integrations': return <IntegrationsTab projectId={projectId} />;
            case 'notifications': return <NotificationsTab projectId={projectId} />;
            default: return <MembersTab projectId={projectId} />;
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0f172a] text-white">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                <p className="text-gray-400">Loading settings...</p>
            </div>
        );
    }

    // Determine if the current user is the owner of the project
    const isOwner = project && (typeof project.owner === 'object' ? project.owner._id === user?._id : project.owner === user?._id);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans p-6 md:p-10 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <ShieldAlert className="text-indigo-500" size={32} />
                        Workspace Admin & Settings
                    </h1>
                    <p className="text-gray-400">Manage global permissions, custom workflows, integrations, and notification routing.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Settings Sidebar Tabs */}
                    <div className="w-full md:w-64 shrink-0 space-y-2 flex flex-col justify-between">
                        <div className="space-y-2">
                            <TabButton
                                active={activeTab === 'members'}
                                onClick={() => setActiveTab('members')}
                                icon={<Users size={18} />}
                                label="Members & Roles"
                            />
                            <TabButton
                                active={activeTab === 'workflow'}
                                onClick={() => setActiveTab('workflow')}
                                icon={<GitMerge size={18} />}
                                label="Workflow & Rules"
                            />
                            <TabButton
                                active={activeTab === 'integrations'}
                                onClick={() => setActiveTab('integrations')}
                                icon={<LinkIcon size={18} />}
                                label="Integrations & APIs"
                            />
                            <TabButton
                                active={activeTab === 'notifications'}
                                onClick={() => setActiveTab('notifications')}
                                icon={<Bell size={18} />}
                                label="Global Notifications"
                            />
                        </div>

                        {/* Danger Zone - Only visible to the Owner */}
                        {isOwner && (
                            <div className="pt-8 mt-8 border-t border-gray-800">
                                <button
                                    onClick={() => setIsDeleteModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition font-bold text-sm bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/20 hover:border-red-500 shadow-lg shadow-red-900/20"
                                >
                                    <Trash2 size={18} />
                                    Delete Workspace
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 bg-[#1e293b] rounded-2xl border border-gray-700 p-6 md:p-8 min-h-[500px] shadow-xl">
                        {renderActiveTab()}
                    </div>
                </div>
            </div>

            {/* Mount the Delete Modal */}
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteProject}
                isDeleting={isDeleting}
                projectTitle={project?.title || project?.name || "this workspace"}
            />
        </div>
    );
};

// Helper component for tabs
const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm
            ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
        `}
    >
        {icon}
        {label}
    </button>
);

export default Settings;