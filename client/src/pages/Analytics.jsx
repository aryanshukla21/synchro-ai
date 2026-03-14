// client/src/pages/Analytics.jsx
import { useState, useEffect } from 'react';
import api from '../api/axios';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { BarChart3, Clock, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const Analytics = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);

    // KPI State
    const [kpis, setKpis] = useState({
        totalTasks: 0,
        completionRate: 0,
        avgCompletionDays: 0,
        bottleneckCount: 0
    });

    // Chart Data State
    const [velocityData, setVelocityData] = useState([]);
    const [bottleneckData, setBottleneckData] = useState([]);
    const [priorityData, setPriorityData] = useState([]);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            // Fetch all tasks for the user to analyze
            const { data } = await api.get('/task/user/me?limit=10000');
            const tasks = data.data || [];

            processData(tasks);
        } catch (error) {
            console.error(error);
            showToast("Failed to load analytics data", "error");
        } finally {
            setLoading(false);
        }
    };

    const processData = (tasks) => {
        const now = new Date();
        const completedTasks = tasks.filter(t => t.status === 'Merged');

        // --- 1. KPI Calculations ---
        const totalTasks = tasks.length;
        const completionRate = totalTasks ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

        // Average Time to Completion (Days between createdAt and updatedAt for merged tasks)
        let totalDays = 0;
        completedTasks.forEach(t => {
            const created = new Date(t.createdAt);
            const updated = new Date(t.updatedAt);
            const diffTime = Math.abs(updated - created);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDays += diffDays;
        });
        const avgCompletionDays = completedTasks.length ? (totalDays / completedTasks.length).toFixed(1) : 0;

        // Bottleneck calculation (Tasks stuck in In-Progress or Review for > 3 days)
        const bottleneckTasks = tasks.filter(t => {
            if (t.status === 'Merged' || t.status === 'To-Do') return false;
            const updated = new Date(t.updatedAt);
            const daysSinceUpdate = Math.ceil(Math.abs(now - updated) / (1000 * 60 * 60 * 24));
            return daysSinceUpdate > 3;
        });

        setKpis({
            totalTasks,
            completionRate,
            avgCompletionDays,
            bottleneckCount: bottleneckTasks.length
        });

        // --- 2. Completion Velocity (Last 7 Days Burndown/Burnup) ---
        const last7Days = [...Array(7)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse(); // Oldest to Newest

        const velocity = last7Days.map(date => {
            // Count tasks completed on this specific day
            const count = completedTasks.filter(t => t.updatedAt.startsWith(date)).length;
            // Format date for display (e.g., "Mon 14")
            const displayDate = new Date(date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
            return { date: displayDate, Completed: count };
        });
        setVelocityData(velocity);

        // --- 3. Bottleneck Analysis (Status Distribution) ---
        setBottleneckData([
            { name: 'To-Do', count: tasks.filter(t => t.status === 'To-Do').length },
            { name: 'In-Progress', count: tasks.filter(t => t.status === 'In-Progress').length },
            { name: 'Review', count: tasks.filter(t => t.status === 'Review-Requested').length },
            { name: 'Merged', count: completedTasks.length }
        ]);

        // --- 4. Priority Distribution ---
        setPriorityData([
            { name: 'High', value: tasks.filter(t => t.priority === 'High').length, color: '#ef4444' }, // Red
            { name: 'Medium', value: tasks.filter(t => t.priority === 'Medium').length, color: '#f59e0b' }, // Amber
            { name: 'Low', value: tasks.filter(t => t.priority === 'Low').length, color: '#3b82f6' } // Blue
        ]);
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#0f172a] text-white">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
                <p className="text-gray-400">Compiling your workspace analytics...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0f172a] text-gray-300 font-sans">
            {/* Header */}
            <header className="px-6 py-5 border-b border-gray-800 bg-[#0f172a] shrink-0 sticky top-0 z-10 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="text-indigo-500" size={24} />
                        Reports & Analytics
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">Deep dive into your team's performance metrics.</p>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 space-y-8 max-w-7xl mx-auto w-full">

                {/* --- KPI CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        label="Total Tasks"
                        value={kpis.totalTasks}
                        icon={<CheckCircle2 size={24} />}
                        color="text-blue-400" bg="bg-blue-500/10"
                    />
                    <KPICard
                        label="Completion Rate"
                        value={`${kpis.completionRate}%`}
                        icon={<BarChart3 size={24} />}
                        color="text-emerald-400" bg="bg-emerald-500/10"
                    />
                    <KPICard
                        label="Avg Time to Complete"
                        value={`${kpis.avgCompletionDays} Days`}
                        icon={<Clock size={24} />}
                        color="text-indigo-400" bg="bg-indigo-500/10"
                    />
                    <KPICard
                        label="Stale Tasks (>3 Days)"
                        value={kpis.bottleneckCount}
                        icon={<AlertTriangle size={24} />}
                        color={kpis.bottleneckCount > 0 ? "text-rose-400" : "text-gray-400"}
                        bg={kpis.bottleneckCount > 0 ? "bg-rose-500/10" : "bg-gray-800"}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* --- VELOCITY CHART (AREA) --- */}
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 lg:col-span-2 shadow-lg">
                        <h2 className="text-lg font-bold text-white mb-6">Completion Velocity (Last 7 Days)</h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                        itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Area type="monotone" dataKey="Completed" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- PRIORITY PIE CHART --- */}
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 shadow-lg flex flex-col">
                        <h2 className="text-lg font-bold text-white mb-6">Priority Distribution</h2>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={priorityData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {priorityData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* --- BOTTLENECK BAR CHART --- */}
                    <div className="bg-[#1e293b] rounded-xl border border-gray-700 p-6 lg:col-span-3 shadow-lg">
                        <h2 className="text-lg font-bold text-white mb-6">Pipeline Bottleneck Analysis</h2>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={bottleneckData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip
                                        cursor={{ fill: '#374151', opacity: 0.4 }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    />
                                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={60}>
                                        {bottleneckData.map((entry, index) => {
                                            const colors = ['#64748b', '#3b82f6', '#f59e0b', '#10b981'];
                                            return <Cell key={`cell-${index}`} fill={colors[index]} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

// Reusable KPI Card Component
const KPICard = ({ label, value, icon, color, bg }) => (
    <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 flex items-center gap-4 shadow-sm hover:border-gray-600 transition">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${bg} ${color} shrink-0`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400 font-medium">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    </div>
);

export default Analytics;