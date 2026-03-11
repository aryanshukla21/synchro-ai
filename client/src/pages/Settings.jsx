import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Link as LinkIcon, Bell, ShieldAlert } from 'lucide-react';
import MembersTab from '../components/settings/MembersTab';
import IntegrationsTab from '../components/settings/IntegrationsTab';
import NotificationsTab from '../components/settings/NotificationsTab';

const Settings = () => {
    const { projectId } = useParams();
    const [activeTab, setActiveTab] = useState('members');

    // Render the correct component based on state
    const renderActiveTab = () => {
        switch (activeTab) {
            case 'members': return <MembersTab projectId={projectId} />;
            case 'integrations': return <IntegrationsTab projectId={projectId} />;
            case 'notifications': return <NotificationsTab projectId={projectId} />;
            default: return <MembersTab projectId={projectId} />;
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans p-6 md:p-10 overflow-y-auto">
            <div className="max-w-5xl mx-auto w-full">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <ShieldAlert className="text-indigo-500" size={32} />
                        Workspace Admin & Settings
                    </h1>
                    <p className="text-gray-400">Manage global permissions, integrations, and notification routing.</p>
                </header>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Settings Sidebar Tabs */}
                    <div className="w-full md:w-64 shrink-0 space-y-2">
                        <TabButton
                            active={activeTab === 'members'}
                            onClick={() => setActiveTab('members')}
                            icon={<Users size={18} />}
                            label="Members & Roles"
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

                    {/* Content Area */}
                    <div className="flex-1 bg-[#1e293b] rounded-2xl border border-gray-700 p-6 md:p-8 min-h-[500px]">
                        {renderActiveTab()}
                    </div>
                </div>
            </div>
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