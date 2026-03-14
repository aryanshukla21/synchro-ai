import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogOut, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);

    // Global keyboard shortcut (Ctrl+K or Cmd+K) to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault(); // Prevent default browser search behavior
                searchInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!user) return null;

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery('');
            searchInputRef.current?.blur(); // Remove focus after searching
        }
    };

    return (
        <nav className="bg-[#1e293b] border-b border-gray-700 sticky top-0 z-50 shadow-md">
            {/* Centered layout maintained */}
            <div className="container mx-auto flex justify-center items-center gap-6 sm:gap-12 px-6 py-3">

                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-3 text-white font-bold text-xl hover:opacity-90 transition shrink-0">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        S
                    </div>
                    <span className="tracking-tight hidden lg:block">Synchro-AI</span>
                </Link>

                {/* Global Search Bar */}
                <form onSubmit={handleSearch} className="relative flex-1 max-w-md w-full group">
                    <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" size={18} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search projects, tasks, or people..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0f172a] border border-gray-600 rounded-full py-2 pl-10 pr-14 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-500"
                    />
                    {/* Visual Shortcut Hint (Hides when typing/focused) */}
                    <div className="absolute right-3 top-2 flex items-center pointer-events-none opacity-50 group-focus-within:opacity-0 transition-opacity">
                        <span className="text-[10px] font-semibold bg-[#1e293b] text-gray-400 py-1 px-1.5 rounded border border-gray-600">
                            ⌘K
                        </span>
                    </div>
                </form>

                {/* Actions & Profile Section */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <NotificationBell />

                    {/* User Profile Info */}
                    <div className="flex items-center gap-3 pl-4 sm:pl-6 border-l border-gray-700 transition-all">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium text-white leading-tight">{user.name}</p>
                            <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">Active</p>
                        </div>

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