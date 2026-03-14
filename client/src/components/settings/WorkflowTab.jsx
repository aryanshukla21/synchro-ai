import { useState } from 'react';
import api from '../../api/axios';
import { useToast } from '../../contexts/ToastContext';
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Settings2, Link as LinkIcon, Users, Loader2 } from 'lucide-react';

const WorkflowTab = ({ project, setProject }) => {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Initialize with project workflow, or fallback to the standard defaults
    const [columns, setColumns] = useState(
        project.workflow?.length > 0 ? project.workflow : [
            { name: 'To-Do', requiredFields: [], autoAssignTo: '' },
            { name: 'In-Progress', requiredFields: [], autoAssignTo: '' },
            { name: 'Review-Requested', requiredFields: ['prLink'], autoAssignTo: '' },
            { name: 'Merged', requiredFields: [], autoAssignTo: '' }
        ]
    );

    const handleAddColumn = () => {
        setColumns([...columns, { name: 'New Column', requiredFields: [], autoAssignTo: '' }]);
    };

    const handleRemoveColumn = (index) => {
        if (columns.length <= 2) {
            showToast("You must have at least 2 columns", "error");
            return;
        }
        setColumns(columns.filter((_, i) => i !== index));
    };

    const moveColumn = (index, direction) => {
        const newCols = [...columns];
        if (direction === 'up' && index > 0) {
            [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
        } else if (direction === 'down' && index < newCols.length - 1) {
            [newCols[index + 1], newCols[index]] = [newCols[index], newCols[index + 1]];
        }
        setColumns(newCols);
    };

    const updateColumn = (index, field, value) => {
        const newCols = [...columns];
        newCols[index][field] = value;
        setColumns(newCols);
    };

    const toggleRequiredField = (index, field) => {
        const newCols = [...columns];
        const currentFields = newCols[index].requiredFields || [];
        if (currentFields.includes(field)) {
            newCols[index].requiredFields = currentFields.filter(f => f !== field);
        } else {
            newCols[index].requiredFields = [...currentFields, field];
        }
        setColumns(newCols);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Assign index-based order before saving
            const workflowToSave = columns.map((col, idx) => ({ ...col, order: idx }));

            const { data } = await api.put(`/projects/${project._id}/workflow`, { workflow: workflowToSave });
            setProject(prev => ({ ...prev, workflow: data.data }));
            showToast("Custom workflow saved successfully!", "success");
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to save workflow", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div>
                <h2 className="text-xl font-bold text-white mb-2">Kanban Columns & Rules</h2>
                <p className="text-sm text-gray-400">Design your pipeline. Reorder stages, set required fields before tasks can be moved, and automate assignments.</p>
            </div>

            <div className="space-y-4">
                {columns.map((col, idx) => (
                    <div key={idx} className="bg-[#1e293b] border border-gray-700 rounded-xl p-5 flex flex-col md:flex-row gap-6 shadow-sm">

                        {/* Column Name & Ordering */}
                        <div className="flex-1 flex gap-4">
                            <div className="flex flex-col gap-1 shrink-0">
                                <button onClick={() => moveColumn(idx, 'up')} disabled={idx === 0} className="p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 transition">
                                    <ArrowUp size={16} />
                                </button>
                                <button onClick={() => moveColumn(idx, 'down')} disabled={idx === columns.length - 1} className="p-1 text-gray-500 hover:text-white hover:bg-gray-700 rounded disabled:opacity-30 transition">
                                    <ArrowDown size={16} />
                                </button>
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1 block">Column Name</label>
                                <input
                                    type="text"
                                    value={col.name}
                                    onChange={(e) => updateColumn(idx, 'name', e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:border-indigo-500 transition"
                                />
                            </div>
                        </div>

                        {/* Rules & Automations */}
                        <div className="flex-[2] grid grid-cols-1 sm:grid-cols-2 gap-6 border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 md:pl-6">

                            {/* Required Fields Rule */}
                            <div>
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Settings2 size={14} className="text-amber-400" /> Required to Enter
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={col.requiredFields?.includes('prLink')}
                                            onChange={() => toggleRequiredField(idx, 'prLink')}
                                            className="rounded border-gray-600 bg-[#0f172a] text-indigo-500 focus:ring-indigo-500/50 cursor-pointer"
                                        />
                                        <LinkIcon size={14} className="text-gray-500 group-hover:text-indigo-400 transition" /> PR / Figma Link
                                    </label>
                                </div>
                            </div>

                            {/* Automation Rule */}
                            <div>
                                <label className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Users size={14} className="text-emerald-400" /> Auto-Assign
                                </label>
                                <select
                                    value={col.autoAssignTo || ''}
                                    onChange={(e) => updateColumn(idx, 'autoAssignTo', e.target.value)}
                                    className="w-full bg-[#0f172a] border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                                >
                                    <option value="">No automation</option>
                                    {project.members?.map(m => (
                                        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Delete Button */}
                        <div className="flex items-center border-t md:border-t-0 md:border-l border-gray-700 pt-4 md:pt-0 md:pl-4">
                            <button
                                onClick={() => handleRemoveColumn(idx)}
                                className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                title="Remove Stage"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                <button
                    onClick={handleAddColumn}
                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 px-4 py-2 rounded-lg font-medium transition"
                >
                    <Plus size={18} /> Add Kanban Stage
                </button>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-900/20 transition disabled:opacity-50"
                >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Workflow
                </button>
            </div>
        </div>
    );
};

export default WorkflowTab;