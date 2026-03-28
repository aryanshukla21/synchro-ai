import { X, User, Flag, Calendar } from 'lucide-react';

const CreateTaskModal = ({ isOpen, onClose, onSubmit, newTask, setNewTask, activeMembers }) => {
    if (!isOpen) return null;

    const handleAssigneeChange = (e) => {
        const selectedId = e.target.value;
        const member = activeMembers.find(m => m.user._id === selectedId);
        setNewTask({
            ...newTask,
            assignedTo: selectedId,
            assigneeEmail: member ? member.user.email : ''
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-5 sm:p-6 w-full max-w-lg shadow-2xl my-8">
                <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-gray-700 pb-3 sm:pb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white">Create New Task</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1"><X size={20} className="sm:w-6 sm:h-6" /></button>
                </div>
                <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                        <label className="text-[10px] sm:text-sm text-gray-400 block mb-1">Task Title <span className="text-red-400">*</span></label>
                        <input
                            className="w-full bg-[#0f172a] border border-gray-600 rounded p-2 sm:p-2.5 text-sm sm:text-base text-white focus:border-indigo-500 outline-none transition"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            required
                            placeholder="e.g. Fix API Endpoint"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] sm:text-sm text-gray-400 block mb-1">Description</label>
                        <textarea
                            className="w-full bg-[#0f172a] border border-gray-600 rounded p-2 sm:p-2.5 text-sm sm:text-base text-white h-20 sm:h-24 resize-none focus:border-indigo-500 outline-none transition"
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            placeholder="Provide details about the task..."
                        />
                    </div>

                    {/* Fixed to stack on mobile, side-by-side on tablet/desktop */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="text-[10px] sm:text-sm text-gray-400 block mb-1 flex items-center gap-1"><User size={12} className="sm:w-3.5 sm:h-3.5" /> Assign To</label>
                            <select
                                className="w-full bg-[#0f172a] border border-gray-600 rounded p-2 sm:p-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                                value={newTask.assignedTo || ''}
                                onChange={handleAssigneeChange}
                            >
                                <option value="">Unassigned</option>
                                {activeMembers.map(m => (
                                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] sm:text-sm text-gray-400 block mb-1 flex items-center gap-1"><Flag size={12} className="sm:w-3.5 sm:h-3.5" /> Priority</label>
                            <select
                                className="w-full bg-[#0f172a] border border-gray-600 rounded p-2 sm:p-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                                value={newTask.priority}
                                onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] sm:text-sm text-gray-400 block mb-1 flex items-center gap-1"><Calendar size={12} className="sm:w-3.5 sm:h-3.5" /> Deadline</label>
                        <input
                            type="date"
                            className="w-full bg-[#0f172a] border border-gray-600 rounded p-2 sm:p-2.5 text-xs sm:text-sm text-white focus:border-indigo-500 outline-none"
                            value={newTask.deadline}
                            onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end pt-3 sm:pt-4 gap-2 sm:gap-3">
                        <button type="button" onClick={onClose} className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-white">Cancel</button>
                        <button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-[#0f172a] px-4 sm:px-6 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition shadow-lg shadow-cyan-500/20">Create Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;