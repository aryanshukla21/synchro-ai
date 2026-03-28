import { useState } from 'react';
import { AlertCircle, Clock, UserX, User, Target } from 'lucide-react';
import TaskDetailPanel from '../kanban/TaskDetailPanel';

const AllProjectTasks = ({ tasks, isOwner, onTaskUpdate }) => {
    const [selectedTask, setSelectedTask] = useState(null);

    const getStatusDisplay = (task) => {
        if (!task.assignedTo) {
            return {
                type: 'special',
                label: 'Yet to Assign',
                color: 'text-gray-400 bg-gray-700/30 border-gray-600',
                icon: UserX
            };
        }

        if (task.assignmentStatus === 'Pending') {
            return {
                type: 'special',
                label: 'Yet to Accept',
                color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                icon: Clock
            };
        }

        return {
            type: 'standard',
            label: task.status
        };
    };

    const visibleTasks = tasks.filter(t => t.assignmentStatus !== 'Declined');

    return (
        <div className="bg-[#1e293b] rounded-2xl border border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 mt-6 shadow-xl relative">
            <div className="p-4 sm:p-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 bg-gray-800/50">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    {isOwner ? (
                        <>
                            <AlertCircle size={18} className="text-indigo-400 shrink-0" />
                            <span className="truncate">All Project Tasks</span>
                            <span className="text-[10px] sm:text-xs font-normal text-gray-500 ml-1 sm:ml-2 hidden sm:inline">(Click task to review)</span>
                        </>
                    ) : (
                        <>
                            <Target size={18} className="text-emerald-400 shrink-0" />
                            <span className="truncate">My Assigned Tasks</span>
                            <span className="text-[10px] sm:text-xs font-normal text-gray-500 ml-1 sm:ml-2 hidden sm:inline">(Click to view details)</span>
                        </>
                    )}
                </h3>
                <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700 whitespace-nowrap self-start sm:self-auto">
                    {visibleTasks.length} {isOwner ? 'Active' : 'Assigned'}
                </span>
            </div>

            {/* Added overflow-x-auto to prevent table breaking on mobile */}
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto custom-scrollbar">
                {visibleTasks.length > 0 ? (
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="text-[10px] sm:text-xs text-gray-500 border-b border-gray-700/50 sticky top-0 bg-[#1e293b] z-10">
                                <th className="p-3 sm:p-4 font-medium w-[250px] sm:w-auto">Task Details</th>
                                <th className="p-3 sm:p-4 font-medium">Assignee</th>
                                <th className="p-3 sm:p-4 font-medium">Status</th>
                                <th className="p-3 sm:p-4 font-medium">Priority</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {visibleTasks.map(task => {
                                const statusDisplay = getStatusDisplay(task);

                                return (
                                    <tr
                                        key={task._id}
                                        onClick={() => setSelectedTask(task)}
                                        className="hover:bg-indigo-500/10 transition group cursor-pointer"
                                    >
                                        <td className="p-3 sm:p-4">
                                            <p className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition truncate pr-2">{task.title}</p>
                                            <p className="text-[9px] sm:text-[10px] text-gray-500 line-clamp-1">{task.description}</p>
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            {task.assignedTo ? (
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] sm:text-[10px] text-white shrink-0">
                                                        {(typeof task.assignedTo === 'object' ? task.assignedTo.name : 'U')?.charAt(0) || <User size={10} className="sm:w-3 sm:h-3" />}
                                                    </div>
                                                    <span className="text-[10px] sm:text-xs text-gray-400 truncate w-16 sm:w-24">
                                                        {typeof task.assignedTo === 'object' ? task.assignedTo.name : 'Assigned'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] sm:text-xs text-gray-600 italic flex items-center gap-1">
                                                    <UserX size={10} className="sm:w-3 sm:h-3" /> Unassigned
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            {statusDisplay.type === 'special' ? (
                                                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded border flex items-center gap-1 w-fit whitespace-nowrap ${statusDisplay.color}`}>
                                                    <statusDisplay.icon size={10} />
                                                    {statusDisplay.label}
                                                </span>
                                            ) : (
                                                <span className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded border whitespace-nowrap font-bold ${task.status === 'Merged' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    task.status === 'In-Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        task.status === 'Submitted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-gray-700/50 text-gray-400 border-gray-600'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-3 sm:p-4">
                                            <span className={`text-[9px] sm:text-[10px] font-bold ${task.priority === 'High' ? 'text-red-400' :
                                                task.priority === 'Medium' ? 'text-yellow-400' : 'text-blue-400'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-12 text-gray-500 text-xs sm:text-sm px-4">
                        {isOwner ? "No active tasks found for this project." : "No tasks have been assigned to you yet."}
                    </div>
                )}
            </div>

            {selectedTask && (
                <TaskDetailPanel
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={(updatedTask) => {
                        onTaskUpdate(updatedTask);
                        setSelectedTask(updatedTask);
                    }}
                />
            )}
        </div>
    );
};

export default AllProjectTasks;