import { MessageSquare, Paperclip, ClipboardCheck } from 'lucide-react';

const TaskCard = ({ task, onClick }) => {
    const priorityColors = {
        High: 'bg-red-500/20 text-red-400 border-red-500/30',
        Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };

    const commentCount = task.commentCount || task.comments?.length || 0;
    const attachmentCount = task.attachmentCount || task.attachments?.length || 0;

    const needsReview = task.status === 'Review-Requested';

    return (
        <div
            onClick={() => onClick(task)}
            className={`p-3 sm:p-4 rounded-xl border shadow-sm cursor-pointer transition-all group flex flex-col h-[110px] sm:h-[130px] ${needsReview
                ? 'bg-[#1e293b] border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:border-emerald-400'
                : 'bg-[#1e293b] border-gray-700 hover:border-indigo-500/50'
                }`}
        >
            <div className="flex justify-between items-start mb-2 sm:mb-3 shrink-0">
                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded border ${priorityColors[task.priority] || priorityColors.Medium}`}>
                    {task.priority?.toUpperCase() || 'MEDIUM'}
                </span>

                {task.assignedTo && (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold shrink-0" title={task.assignedTo.name}>
                        {task.assignedTo.name?.charAt(0) || 'U'}
                    </div>
                )}
            </div>

            {/* Review Badge */}
            {needsReview && (
                <div className="mb-1.5 sm:mb-2 w-fit px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                    <ClipboardCheck size={10} className="sm:w-3 sm:h-3" /> Needs Review
                </div>
            )}

            <h4 className="text-gray-200 font-medium text-xs sm:text-sm mb-2 line-clamp-2 leading-snug">
                {task.title}
            </h4>

            {/* Dynamic Counters pinned to the bottom */}
            <div className="flex items-center gap-2 sm:gap-3 text-gray-500 text-[10px] sm:text-xs mt-auto shrink-0">
                <div className="flex items-center gap-1">
                    <MessageSquare size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span>{commentCount}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Paperclip size={12} className="sm:w-3.5 sm:h-3.5" />
                    <span>{attachmentCount}</span>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;