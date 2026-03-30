import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, Target, Folder, Users, BarChart,
    CheckSquare, Clock, LogOut
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Sidebar from './Sidebar';
import GlobalSocketListener from './GlobalSocketListener';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(
        typeof window !== 'undefined' ? window.innerWidth >= 768 : true
    );
    const location = useLocation();
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isActive = (path) => location.pathname === path || (path === '/dashboard' && location.pathname === '/');

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

            {!isSidebarOpen && (
                <div className="fixed top-0 left-0 h-[100dvh] w-14 sm:w-16 bg-[#1e293b] border-r border-gray-700 flex flex-col items-center py-4 sm:py-5 z-[60] transition-all shadow-xl">

                    {/* App Logo acting as an expand button when closed */}
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-8 h-8 sm:w-10 sm:h-10 mb-4 sm:mb-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg cursor-pointer hover:bg-indigo-500 transition-colors shadow-lg"
                        title="Expand Sidebar"
                    >
                        S
                    </button>

                    <div className="flex-1 w-full flex flex-col items-center justify-start gap-3 sm:gap-4 mt-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`group relative p-2 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${isActive(item.path)
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="absolute left-14 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity shadow-xl border border-gray-700">
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>

                    <div className="mt-auto w-full flex flex-col items-center gap-3 sm:gap-4 pt-4 border-t border-gray-700">
                        <Link to="/profile" className="group relative">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm overflow-hidden ring-2 ring-transparent hover:ring-indigo-400 transition-all">
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
                            <LogOut className="w-5 h-5" />
                            <span className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] transition-opacity shadow-xl border border-gray-700">
                                Logout
                            </span>
                        </button>
                    </div>
                </div>
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

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