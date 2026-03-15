import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Circle, Check } from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext'; // --- ADDED TOAST ---

const NotificationBell = () => {
    const { socket } = useSocket();
    const { showToast } = useToast(); // --- ADDED TOAST ---
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    // 1. Fetch historical notifications on load
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                setNotifications(data.data || []);

                // Calculate unread count
                const unread = (data.data || []).filter(n => !n.isRead).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };

        fetchNotifications();
    }, []);

    // 2. Real-time Socket Listener for NEW notifications
    useEffect(() => {
        if (!socket) return;

        const handleNewNotification = (newNotif) => {
            setNotifications(prev => [
                {
                    // FIX: Use the real DB _id if the backend sends it, otherwise fallback
                    _id: newNotif._id || Date.now().toString(),
                    message: newNotif.message,
                    type: newNotif.type,
                    isRead: false,
                    createdAt: newNotif.createdAt || new Date().toISOString()
                },
                ...prev
            ]);

            setUnreadCount(prev => prev + 1);
        };

        socket.on('new-notification', handleNewNotification);

        return () => {
            socket.off('new-notification', handleNewNotification);
        };
    }, [socket]);

    // 3. Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 4. Mark single notification as read
    const markAsRead = async (id, e) => {
        if (e) e.stopPropagation();

        // Prevent backend crash if we try to update a notification with a fake Socket timestamp ID
        if (!id || id.length < 10) return;

        try {
            // Optimistic UI update
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            // 🔥 CHANGED FROM api.put TO api.patch 🔥
            await api.patch(`/notifications/${id}/read`);
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to mark as read", "error");

            // Revert optimistic update on failure
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: false } : n));
            setUnreadCount(prev => prev + 1);
        }
    };

    // 5. Mark all as read
    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);

            // 🔥 CHANGED FROM api.put TO api.patch 🔥
            await api.patch('/notifications/read-all');
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to mark all as read", "error");
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon & Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-white transition rounded-full hover:bg-gray-800"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#0f172a]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1e293b] rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-[#0f172a]/50">
                        <h3 className="font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                            >
                                <Check size={14} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="mx-auto mb-3 opacity-20" size={32} />
                                <p className="text-sm">You have no notifications.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-700/50">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif._id}
                                        // FIX: Made the entire notification body clickable!
                                        onClick={(e) => !notif.isRead && markAsRead(notif._id, e)}
                                        className={`p-4 flex gap-3 transition cursor-pointer hover:bg-gray-800/50 ${!notif.isRead ? 'bg-indigo-900/10' : ''}`}
                                    >
                                        <div className="mt-0.5">
                                            {!notif.isRead ? (
                                                <Circle className="text-indigo-500 fill-indigo-500" size={10} />
                                            ) : (
                                                <CheckCircle2 className="text-gray-600" size={14} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${!notif.isRead ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                                                {notif.message}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <button
                                                onClick={(e) => markAsRead(notif._id, e)}
                                                className="opacity-0 group-hover:opacity-100 text-xs text-indigo-400 hover:text-white transition self-center"
                                                title="Mark as read"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;