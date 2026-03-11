import { useState } from 'react';
import { MessageSquare, Save } from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';

const NotificationsTab = ({ projectId }) => {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const [webhooks, setWebhooks] = useState({
        slack: '',
        discord: '',
        notifyOnSubmit: true,
        notifyOnMerge: true
    });

    const handleSaveWebhooks = async () => {
        setIsLoading(true);
        try {
            // API call to persist webhook preferences to MongoDB
            await api.put(`/projects/${projectId}/notifications`, webhooks);
            showToast('Notification preferences updated', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to save notifications', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white mb-2">Webhook Notifications</h2>
            <p className="text-sm text-gray-400 mb-6">Send automated updates to your team's communication channels.</p>

            <div className="space-y-6">
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                        <MessageSquare size={16} className="text-blue-400" /> Slack Webhook URL
                    </label>
                    <input
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={webhooks.slack}
                        onChange={(e) => setWebhooks({ ...webhooks, slack: e.target.value })}
                        className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                    />
                </div>

                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-300 mb-2">
                        <MessageSquare size={16} className="text-indigo-400" /> Discord Webhook URL
                    </label>
                    <input
                        type="url"
                        placeholder="https://discord.com/api/webhooks/..."
                        value={webhooks.discord}
                        onChange={(e) => setWebhooks({ ...webhooks, discord: e.target.value })}
                        className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2.5 text-white outline-none focus:border-indigo-500 transition"
                    />
                </div>

                <div className="pt-4 border-t border-gray-700">
                    <h3 className="font-bold text-white mb-4">Event Triggers</h3>
                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={webhooks.notifyOnSubmit}
                            onChange={(e) => setWebhooks({ ...webhooks, notifyOnSubmit: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-600 bg-[#0f172a] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-300 text-sm">Notify when new work is submitted for review</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={webhooks.notifyOnMerge}
                            onChange={(e) => setWebhooks({ ...webhooks, notifyOnMerge: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-600 bg-[#0f172a] text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-300 text-sm">Notify when a task is approved/merged</span>
                    </label>
                </div>

                <button
                    onClick={handleSaveWebhooks}
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition w-full disabled:opacity-50"
                >
                    <Save size={18} /> Save Preferences
                </button>
            </div>
        </div>
    );
};

export default NotificationsTab;