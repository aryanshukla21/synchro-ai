import { useState, useEffect, useRef } from 'react';
import { Bell, Info } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../contexts/SocketContext'; // Import socket hook

const NotificationBell = () => {
    const { user } = useAuth();
    const { socket } = useSocket(); // Initialize socket
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Fetch Initial Notifications
    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications');
            // Ensure data.data is an array
            setNotifications(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error("Failed to load notifications", error);
            setNotifications([]);
        }
    };

    // Initial Fetch on mount or when user changes
    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    // Real-time socket listener for incoming notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (newNotification) => {
            setNotifications((prev) => [newNotification, ...prev]);
        };

        // Listen for 'newNotification' event emitted by the backend
        socket.on('newNotification', handleNewNotification);

        // Cleanup listener on unmount or socket change
        return () => {
            socket.off('newNotification', handleNewNotification);
        };
    }, [socket]);

    // Handle Click Outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Action failed", error);
        }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error("Action failed", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* BELL BUTTON */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-gray-800 focus:outline-none"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1e293b] animate-pulse"></span>
                )}
            </button>

            {/* DROPDOWN PANEL */}
            {showDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-[#1e293b] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">

                    {/* Header */}
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                        <h3 className="text-sm font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* List */}
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div
                                    key={notif._id}
                                    onClick={() => !notif.isRead && markAsRead(notif._id)}
                                    className={`p-4 border-b border-gray-700/50 last:border-0 hover:bg-gray-800/50 transition cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-indigo-500/5' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className="mt-1 shrink-0">
                                        {notif.sender?.avatar ? (
                                            <img src={notif.sender.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                                                {notif.sender?.name?.charAt(0) || <Info size={14} />}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm leading-tight ${!notif.isRead ? 'text-white font-medium' : 'text-gray-400'}`}>
                                            {notif.message}
                                        </p>
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>

                                    {/* Unread Indicator */}
                                    {!notif.isRead && (
                                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                                <Bell size={24} className="opacity-20" />
                                <p>No notifications yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;