// Currently not used anywhere

import { useState, useEffect } from 'react';
import api from '../../api/axios'; // Ensure this path matches your folder structure

const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-gray-700/50 p-4 rounded-lg flex items-center gap-4 border border-gray-600">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-400">{label}</p>
            <p className="text-xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const QuickStats = ({ projectId }) => {
    const [stats, setStats] = useState({
        dueToday: 0,
        completedWeek: 0,
        activeMembers: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStatsData = async () => {
            try {
                // Bypass pagination to get the full scope of data for accurate math
                const endpoint = projectId
                    ? `/task/project/${projectId}?limit=10000`
                    : `/task/user/me?limit=10000`;

                const { data } = await api.get(endpoint);
                const allTasks = data.data;

                const today = new Date().toDateString();

                // 1. Calculate Tasks Due Today
                const dueTodayCount = allTasks.filter(t => {
                    if (!t.deadline) return false;
                    return new Date(t.deadline).toDateString() === today;
                }).length;

                // 2. Calculate Completed Tasks
                const completedCount = allTasks.filter(t => t.status === 'Merged').length;

                // 3. Dynamically Calculate Unique Active Team Members
                const uniqueMembers = new Set();
                allTasks.forEach(t => {
                    if (t.assignedTo && t.assignedTo._id) {
                        uniqueMembers.add(t.assignedTo._id);
                    } else if (t.assignedTo) {
                        uniqueMembers.add(t.assignedTo); // Fallback if populated as a string ID
                    }
                });

                setStats({
                    dueToday: dueTodayCount,
                    completedWeek: completedCount,
                    activeMembers: uniqueMembers.size > 0 ? uniqueMembers.size : 1 // Fallback to 1 for the viewer
                });

            } catch (error) {
                console.error("Failed to fetch tasks for QuickStats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStatsData();
    }, [projectId]);

    if (loading) {
        return <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 animate-pulse h-[300px]"></div>;
    }

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col gap-4">
            <h3 className="text-gray-200 font-semibold mb-2">Quick Stats</h3>
            <StatCard
                label="Tasks Due Today"
                value={stats.dueToday}
                icon="📅"
                color="bg-yellow-500/20 text-yellow-500"
            />
            <StatCard
                label="Completed Tasks"
                value={stats.completedWeek}
                icon="✅"
                color="bg-green-500/20 text-green-500"
            />
            <StatCard
                label="Active Team Members"
                value={stats.activeMembers}
                icon="👥"
                color="bg-blue-500/20 text-blue-500"
            />
        </div>
    );
};

export default QuickStats;