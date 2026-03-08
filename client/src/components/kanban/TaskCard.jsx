import { MessageSquare, Paperclip } from 'lucide-react';

const TaskCard = ({ task, onClick }) => {
    const priorityColors = {
        High: 'bg-red-500/20 text-red-400 border-red-500/30',
        Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };

    // If your backend ever populates 'commentCount' or 'comments' arrays, it will reflect here.
    // Otherwise, it cleanly defaults to 0 instead of a fake hardcoded number.
    const commentCount = task.commentCount || task.comments?.length || 0;
    const attachmentCount = task.attachmentCount || task.attachments?.length || 0;

    return (
        <div
            onClick={() => onClick(task)}
            className="bg-[#1e293b] p-4 rounded-xl border border-gray-700 shadow-sm hover:border-indigo-500/50 cursor-pointer transition-all group"
        >
            <div className="flex justify-between items-start mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.Medium}`}>
                    {task.priority?.toUpperCase() || 'MEDIUM'}
                </span>
                {task.assignedTo && (
                    <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                        {task.assignedTo.name?.charAt(0) || 'U'}
                    </div>
                )}
            </div>

            <h4 className="text-gray-200 font-medium text-sm mb-3 line-clamp-2">
                {task.title}
            </h4>

            {/* Dynamic Counters */}
            <div className="flex items-center gap-3 text-gray-500 text-xs mt-auto">
                <div className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    <span>{commentCount}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Paperclip size={14} />
                    <span>{attachmentCount}</span>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;