import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, MoreVertical, ChevronRight,
    Settings, X, Save, Loader2,
    Download, FileText, Table, ClipboardCheck,
    FolderOpen, Bug
} from 'lucide-react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import NotificationBell from '../NotificationBell';

const ProjectHeader = ({ project, onTaskCreate, onUpdateProject, isOwner, onExportPDF, onExportCSV }) => {
    const { showToast } = useToast();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        aiApiKey: ''
    });

    useEffect(() => {
        if (project) {
            setFormData({
                title: project.title || '',
                description: project.description || '',
                aiApiKey: ''
            });
        }
    }, [project]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { title: formData.title, description: formData.description };
            if (formData.aiApiKey.trim()) payload.aiApiKey = formData.aiApiKey;

            const { data } = await api.put(`/projects/${project._id}`, payload);
            if (onUpdateProject) onUpdateProject(data.data);
            showToast('Project updated successfully', 'success');
            setIsEditModalOpen(false);
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <header className="h-16 border-b border-gray-800 bg-[#0f172a]/95 backdrop-blur flex items-center justify-between px-6 shrink-0 relative z-40">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Link to="/" className="hover:text-white transition">Dashboard</Link>
                    <ChevronRight size={14} />
                    <span className="text-white font-medium truncate max-w-[200px]">
                        {project?.title || project?.name}
                    </span>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3">

                    <div className="relative">
                        {/* Trigger Button */}
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg border border-gray-600 transition"
                        >
                            <Download size={16} />
                            <span className="hidden sm:inline">Export</span>
                        </button>

                        {/* Dropdown Menu */}
                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                {/* Export to PDF Option */}
                                <button
                                    onClick={() => { onExportPDF(); setShowExportMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-indigo-600/20 hover:text-white transition text-left border-b border-gray-800"
                                >
                                    <FileText size={16} className="text-red-400" />
                                    Export as PDF
                                </button>
                                {/* Export to CSV Option */}
                                <button
                                    onClick={() => { onExportCSV(); setShowExportMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-indigo-600/20 hover:text-white transition text-left"
                                >
                                    <Table size={16} className="text-emerald-400" />
                                    Export as CSV
                                </button>
                            </div>
                        )}
                    </div>

                    <NotificationBell />

                    {/* Files & Assets Button (Visible to all project members) --- */}
                    <Link
                        to={`/project/${project?._id}/assets`}
                        className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-gray-700 transition"
                    >
                        <FolderOpen size={18} />
                        <span className="hidden sm:inline">Files</span>
                    </Link>

                    <Link
                        to={`/project/${project?._id}/issues`}
                        className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-rose-500/30 transition"
                    >
                        <Bug size={18} />
                        <span className="hidden sm:inline">Issues</span>
                    </Link>

                    {isOwner && (
                        <>
                            {/* Review Submissions Button */}
                            <Link
                                to={`/project/${project?._id}/reviews`}
                                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-emerald-500/30 transition"
                            >
                                <ClipboardCheck size={18} />
                                <span className="hidden md:inline">Reviews</span>
                            </Link>

                            <Link
                                to={`/project/${project?._id}/settings`}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-gray-700 transition"
                            >
                                <Settings size={18} />
                                <span className="hidden md:inline">Settings</span>
                            </Link>

                            <button
                                onClick={onTaskCreate}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg shadow-indigo-500/20 transition"
                            >
                                <Plus size={18} />
                                <span className="hidden md:inline">New Task</span>
                            </button>
                        </>
                    )}

                    <button className="p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-800">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            {/* EDIT PROJECT MODAL */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
                    <div className="bg-[#1e293b] rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Settings className="text-indigo-400" size={24} />
                                Workspace Settings
                            </h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white p-1"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Project Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-indigo-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg py-3 px-4 text-white focus:border-indigo-500 outline-none h-24 resize-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700/50">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default ProjectHeader;