import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const AIPulseCard = ({ aiSummary }) => {
    return (
        <div className="bg-gradient-to-br from-[#1e293b] to-[#2a3655] p-1 rounded-2xl shadow-lg shadow-indigo-500/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 blur-xl opacity-50 group-hover:opacity-70 transition duration-1000"></div>
            <div className="bg-[#1e293b]/90 backdrop-blur p-4 sm:p-6 rounded-xl relative z-10 h-full flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-pulse-slow" />
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white truncate">AI Project Pulse</h3>
                    </div>
                    <p className="text-gray-300 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed italic line-clamp-4 sm:line-clamp-none">
                        {aiSummary || "AI is analyzing your project patterns. Keep adding tasks to generate insights."}
                    </p>
                </div>
                <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-gray-700/50">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                        <span className="text-gray-400 flex items-center gap-1.5 sm:gap-2">
                            <CheckCircle2 size={12} className="sm:w-3.5 sm:h-3.5 text-emerald-500" /> Team Velocity
                        </span>
                        <span className="text-emerald-400 font-medium">Stable</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs">
                        <span className="text-gray-400 flex items-center gap-1.5 sm:gap-2">
                            <AlertCircle size={12} className="sm:w-3.5 sm:h-3.5 text-yellow-500" /> Detected Risks
                        </span>
                        <span className="text-yellow-400 font-medium">None</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIPulseCard;