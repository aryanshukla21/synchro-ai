import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Folder, CheckSquare, X, LogOut, BarChart, Target, Users, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const sidebarClasses = `
    fixed top-0 left-0 h-[100dvh] bg-[#1e293b] border-r border-gray-700 w-64 z-[70]
    transform transition-transform duration-300 ease-in-out shadow-2xl
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

    const handleLinkClick = () => {
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    return (
        <aside className={sidebarClasses}>
            <div className="p-6 flex items-center justify-between border-b border-gray-700">
                <div className="flex items-center gap-3 text-white font-bold text-xl">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">S</div>
                    Synchro-AI
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition p-1 rounded-md hover:bg-gray-700 md:hidden"
                >
                    <X size={20} />
                </button>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-gray-700">
                <NavItem to="/dashboard" icon={<LayoutGrid size={20} />} label="Dashboard" active={isActive('/dashboard') || isActive('/')} onClick={handleLinkClick} />
                <NavItem to="/my-work" icon={<Target size={20} />} label="My Work" active={isActive('/my-work')} onClick={handleLinkClick} />
                <NavItem to="/my-projects" icon={<Folder size={20} />} label="My Projects" active={isActive('/my-projects')} onClick={handleLinkClick} />
                <NavItem to="/workload" icon={<Users size={20} />} label="Resource Allocation" active={isActive('/workload')} onClick={handleLinkClick} />
                <NavItem to="/analytics" icon={<BarChart size={20} />} label="Reports & Analytics" active={isActive('/analytics')} onClick={handleLinkClick} />
                <NavItem to="/kanban" icon={<CheckSquare size={20} />} label="Kanban Board" active={isActive('/kanban')} onClick={handleLinkClick} />
                <NavItem to="/timesheet" icon={<Clock size={20} />} label="Timesheets" active={isActive('/timesheet')} onClick={handleLinkClick} />
            </nav>

            <div className="p-4 border-t border-gray-700 absolute bottom-0 w-full bg-[#1e293b]">
                <div className="bg-gray-800 p-3 rounded-lg flex items-center justify-between group hover:bg-gray-750 transition">
                    <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={handleLinkClick}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                            {user?.avatar && user.avatar.startsWith('http') ? (
                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                user?.name?.charAt(0) || 'U'
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm text-white font-medium truncate w-24">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate w-24">View Profile</p>
                        </div>
                    </Link>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            logout();
                        }}
                        className="text-gray-500 hover:text-red-400 transition ml-2 z-50 relative"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

const NavItem = ({ to, icon, label, active, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`
      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
      ${active
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }
    `}
    >
        {icon}
        <span className="text-sm font-medium">{label}</span>
    </Link>
);

export default Sidebar;