import { useState, useEffect } from 'react';
import { Key, Github, Save, GitBranch } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';

const IntegrationsTab = ({ projectId }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // 1. Add githubRepoPath to your state
    const [integrations, setIntegrations] = useState({
        geminiApiKey: '',
        githubToken: '',
        githubRepoPath: ''
    });

    // Fetch existing settings on load
    useEffect(() => {
        const fetchIntegrations = async () => {
            try {
                const { data } = await api.get(`/projects/${projectId}`);
                if (data?.data?.integrations) {
                    setIntegrations(prev => ({
                        ...prev,
                        // Pre-fill the repo path. We purposely DO NOT pre-fill 
                        // the API tokens for security; they remain blank.
                        githubRepoPath: data.data.integrations.githubRepoPath || ''
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch project settings", error);
            }
        };
        fetchIntegrations();
    }, [projectId]);

    const handleSaveIntegrations = async () => {
        setIsLoading(true);
        try {
            await api.put(`/projects/${projectId}/integrations`, integrations);
            showToast('Integration keys saved successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save integrations', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-2">Connected Apps & APIs</h2>
            <p className="text-sm text-gray-400 mb-6">Connect third-party services to enhance your workspace capabilities.</p>

            <div className="space-y-5">
                {/* Gemini Integration */}
                <div className="p-5 border border-gray-700 rounded-xl bg-[#0f172a]/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg"><Key size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white">Gemini AI API Key</h3>
                            <p className="text-xs text-gray-500">Required for global automated PR reviews and smart pulse features.</p>
                        </div>
                    </div>
                    <input
                        type="password"
                        placeholder="sk-..."
                        value={integrations.geminiApiKey}
                        onChange={(e) => setIntegrations({ ...integrations, geminiApiKey: e.target.value })}
                        className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                    />
                </div>

                {/* GitHub Integration */}
                <div className="p-5 border border-gray-700 rounded-xl bg-[#0f172a]/50">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-gray-700 text-white rounded-lg"><Github size={20} /></div>
                        <div>
                            <h3 className="font-bold text-white">GitHub Personal Access Token</h3>
                            <p className="text-xs text-gray-500">Allows Synchro-AI to fetch repository data and create PRs.</p>
                        </div>
                    </div>
                    <input
                        type="password"
                        placeholder="ghp_..."
                        value={integrations.githubToken}
                        onChange={(e) => setIntegrations({ ...integrations, githubToken: e.target.value })}
                        className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition mb-4"
                    />

                    {/* 2. Add the Target Repository Input */}
                    <div className="pt-4 border-t border-gray-700">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                            <GitBranch size={16} className="text-emerald-400" /> Target Repository
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., username/repository-name"
                            value={integrations.githubRepoPath}
                            onChange={(e) => setIntegrations({ ...integrations, githubRepoPath: e.target.value })}
                            className="w-full bg-[#1e293b] border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                        />
                        <p className="text-xs text-gray-500 mt-2">The exact path where automated Pull Requests will be opened.</p>
                    </div>
                </div>

                <button
                    onClick={handleSaveIntegrations}
                    disabled={isLoading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition w-full disabled:opacity-50"
                >
                    <Save size={18} /> Save Integrations
                </button>
            </div>
        </div>
    );
};

export default IntegrationsTab;