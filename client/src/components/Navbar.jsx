import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <nav className="bg-[#1e293b] border-b border-gray-700 sticky top-0 z-50 shadow-md">
            {/* Added max-w-7xl and mx-auto to center the navbar data items horizontally */}
            <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">

                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        S
                    </div>
                    <span className="tracking-tight">Synchro-AI</span>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-6">

                    {/* REUSABLE NOTIFICATION BELL */}
                    <NotificationBell />

                    {/* User Profile Info */}
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Active</p>
                        </div>

                        {/* UPDATED: Dynamic Avatar Rendering */}
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={`${user.name}'s Avatar`}
                                className="w-9 h-9 rounded-full object-cover shadow-md ring-2 ring-[#1e293b]"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-[#1e293b]">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-red-400 transition p-2 rounded-full hover:bg-gray-800"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;