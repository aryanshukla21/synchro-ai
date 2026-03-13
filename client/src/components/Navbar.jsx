import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();

    if (!user) return null;

    return (
        <nav className="bg-[#1e293b] border-b border-gray-700 sticky top-0 z-50 shadow-md">

            {/* Optimized Layout: 
              Using justify-center to keep all navbar data perfectly centered 
            */}
            <div className="container mx-auto flex justify-center items-center gap-8 sm:gap-24 px-6 py-3">

                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        S
                    </div>
                    <span className="tracking-tight hidden sm:block">Synchro-AI</span>
                </Link>

                {/* Actions & Profile Section */}
                <div className="flex items-center gap-4 sm:gap-6">

                    {/* REUSABLE NOTIFICATION BELL */}
                    <NotificationBell />

                    {/* User Profile Info */}
                    <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-gray-700 transition-all">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                            <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">Active</p>
                        </div>

                        {/* Dynamic Avatar Rendering */}
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={`${user.name}'s Avatar`}
                                className="w-9 h-9 rounded-full object-cover shadow-md ring-2 ring-[#0f172a] hover:ring-indigo-500 transition-all cursor-pointer"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-[#0f172a] hover:ring-indigo-400 transition-all cursor-pointer">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-red-400 transition p-2 rounded-full hover:bg-gray-800 ml-2"
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