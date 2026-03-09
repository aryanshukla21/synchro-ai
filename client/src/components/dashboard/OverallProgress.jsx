import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import api from '../../api/axios'; // Ensure this matches your project structure

const OverallProgress = ({ projectId }) => {
    const [progressData, setProgressData] = useState({ percentage: 0, completed: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProgressData = async () => {
            try {
                // Bypass pagination to get the full scope of data for accurate math
                const endpoint = projectId
                    ? `/task/project/${projectId}?limit=10000`
                    : `/task/user/me?limit=10000`;

                const { data } = await api.get(endpoint);
                const allTasks = data.data;

                const total = allTasks.length;
                const completed = allTasks.filter(t => t.status === 'Merged').length;

                // Safely calculate percentage to avoid division by zero
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

                setProgressData({ percentage, completed, total });
            } catch (error) {
                console.error("Failed to fetch tasks for OverallProgress", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProgressData();
    }, [projectId]);

    if (loading) {
        return (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 h-[300px] animate-pulse flex flex-col">
                <h3 className="text-gray-200 font-semibold mb-4 flex items-center gap-2">
                    <span className="text-green-400">📈</span> Overall Progress
                </h3>
            </div>
        );
    }

    const { percentage } = progressData;

    // Setup Recharts data
    const data = [
        { name: 'Completed', value: percentage },
        { name: 'Remaining', value: Math.max(0, 100 - percentage) }, // Prevent negative values
    ];
    const COLORS = ['#10B981', '#374151']; // Green & Dark Gray

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-gray-200 font-semibold mb-4 flex items-center gap-2">
                <span className="text-green-400">📈</span> Overall Progress
            </h3>
            <div className="h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>

                {/* Overlay Text - Added pointer-events-none so it doesn't block Recharts tooltips */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-4xl font-bold text-white">{percentage}%</span>
                    <span className="text-xs text-gray-400">Complete</span>
                </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-2">Project completion status</p>
        </div>
    );
};

export default OverallProgress;