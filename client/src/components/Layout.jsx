import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import GlobalSocketListener from './GlobalSocketListener';

const Layout = () => {
    // State is lifted here to persist across pages
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-[#0f172a] text-gray-300 font-sans flex">
            {/* Invisible listener to catch real-time socket events across the entire app */}
            <GlobalSocketListener />

            {/* The Global Sidebar */}
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content Area */}
            {/* This div adjusts its margin based on sidebar state */}
            <div
                className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'
                    }`}
            >
                {/* Outlet renders the current page (Dashboard, MyTasks, etc.) */}
                {/* We pass the state down so pages can show the Toggle Button */}
                <Outlet context={{ isSidebarOpen, setIsSidebarOpen }} />
            </div>
        </div>
    );
};

export default Layout;