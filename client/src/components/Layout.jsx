import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    Menu, LayoutGrid, Target, Folder, Users, BarChart,
    CheckSquare, Clock, LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import GlobalSocketListener from './GlobalSocketListener';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

    // 🔥 FIX: Instead of rendering the icon here, we pass the component reference.
    // This allows us to inject dynamic, screen-responsive Tailwind classes later.
    const navItems = [
        { path: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
        { path: '/my-work', icon: Target, label: 'My Work' },
        { path: '/my-projects', icon: Folder, label: 'My Projects' },
        { path: '/workload', icon: Users, label: 'Resource Allocation' },
        { path: '/analytics', icon: BarChart, label: 'Reports & Analytics' },
        { path: '/kanban', icon: CheckSquare, label: 'Kanban Board' },
        { path: '/timesheet', icon: Clock, label: 'Timesheets' },
    ];

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans flex relative">
            <GlobalSocketListener />

            {/* Collapsed Mini-Sidebar Strip */}
            {!isSidebarOpen && (
                <div className="fixed top-0 left-0 h-full w-14 sm:w-16 bg-[#1e293b] border-r border-gray-700 flex flex-col items-center py-4 sm:py-5 z-50 transition-all shadow-xl">

                    {/* Expand Sidebar Button */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="group relative p-2 mb-4 sm:mb-6 bg-[#0f172a] border border-gray-600 rounded-lg text-gray-400 hover:text-indigo-400 hover:border-indigo-500 transition-all shadow-md"
                    >
                        {/* Dynamic Size */}
                        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity shadow-xl border border-gray-700">
                            Expand Sidebar
                        </span>
                    </button>

                    {/* Navigation Icons Container */}
                    {/* 🔥 FIX: Removed 'overflow-y-auto' so tooltips can escape the container. Added 'justify-center' to balance items naturally */}
                    <div className="flex-1 w-full flex flex-col items-center justify-center gap-3 sm:gap-4">
                        {navItems.map((item) => {
                            const Icon = item.icon; // Instantiating the dynamic icon
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`group relative p-2 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${isActive(item.path)
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    {/* Dynamic Icon Sizing based on screen width */}
                                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />

                                    {/* Tooltip */}
                                    <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity shadow-xl border border-gray-700">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Footer: Profile & Logout */}
                    <div className="mt-auto w-full flex flex-col items-center gap-3 sm:gap-4 pt-4 border-t border-gray-700">

                        <Link to="/profile" className="group relative">
                            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden ring-2 ring-transparent hover:ring-indigo-400 transition-all">
                                {user?.avatar && user.avatar.startsWith('http') ? (
                                    <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <span className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity shadow-xl border border-gray-700">
                                View Profile
                            </span>
                        </Link>

                        <button
                            onClick={logout}
                            className="group relative p-2 sm:p-2.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-xl transition-all"
                        >
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity shadow-xl border border-gray-700">
                                Logout
                            </span>
                        </button>
                    </div>

                </div>
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Adjusted responsive margin to match the dynamic mini-sidebar width */}
            <div
                className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-14 sm:ml-16'
                    }`}
            >
                <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
            </div>
        </div>
    );
};

export default Layout;