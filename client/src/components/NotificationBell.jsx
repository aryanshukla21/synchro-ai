import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, Circle, Check } from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';

const NotificationBell = () => {
    const { socket } = useSocket();
    const { showToast } = useToast();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                setNotifications(data.data || []);
                const unread = (data.data || []).filter(n => !n.isRead).length;
                setUnreadCount(unread);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            }
        };
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (!socket) return;
        const handleNewNotification = (newNotif) => {
            setNotifications(prev => [
                {
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
        return () => socket.off('new-notification', handleNewNotification);
    }, [socket]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id, e) => {
        if (e) e.stopPropagation();
        if (!id || id.length < 10) return;

        try {
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await api.patch(`/notifications/${id}/read`);
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to mark as read", "error");
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: false } : n));
            setUnreadCount(prev => prev + 1);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            await api.patch('/notifications/read-all');
        } catch (error) {
            showToast(error.response?.data?.message || "Failed to mark all as read", "error");
        }
    };

    return (
        < div className="sm:relative" ref={dropdownRef} >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-1.5 sm:p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-800"
            >
                <Bell size={18} className="sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 sm:right-1.5 flex h-3.5 w-3.5 sm:h-4 sm:w-4 items-center justify-center rounded-full bg-red-500 text-[9px] sm:text-[10px] font-bold text-white ring-2 ring-[#0f172a]">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {
                isOpen && (

                    < div className="absolute top-[100%] left-2 right-2 sm:top-auto sm:left-auto sm:right-0 mt-2 sm:w-96 bg-[#1e293b] rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200" >
                        <div className="p-3 sm:p-4 border-b border-gray-700 flex items-center justify-between bg-[#0f172a]/50">
                            <h3 className="font-bold text-white text-sm sm:text-base">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-[10px] sm:text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition cursor-pointer z-10"
                                >
                                    <Check size={12} className="sm:w-3.5 sm:h-3.5" /> Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-6 sm:p-8 text-center text-gray-500">
                                    <Bell className="mx-auto mb-2 sm:mb-3 opacity-20 w-6 h-6 sm:w-8 sm:h-8" />
                                    <p className="text-xs sm:text-sm">You have no notifications.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-700/50 flex flex-col">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            onClick={(e) => !notif.isRead && markAsRead(notif._id, e)}
                                            className={`p-3 sm:p-4 flex gap-2 sm:gap-3 transition cursor-pointer hover:bg-gray-800/50 group relative ${!notif.isRead ? 'bg-indigo-900/10' : ''}`}
                                        >
                                            <div className="mt-0.5 sm:mt-1 shrink-0">
                                                {!notif.isRead ? (
                                                    <Circle className="text-indigo-500 fill-indigo-500 w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                                ) : (
                                                    <CheckCircle2 className="text-gray-600 w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <p className={`text-xs sm:text-sm leading-snug ${!notif.isRead ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-[9px] sm:text-[10px] text-gray-500 mt-1">
                                                    {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            {!notif.isRead && (
                                                <button
                                                    onClick={(e) => markAsRead(notif._id, e)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-white transition p-2 cursor-pointer z-10"
                                                    title="Mark as read"
                                                >
                                                    <Check size={14} className="sm:w-4 sm:h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div >
                )
            }
        </div >
    );
};

export default NotificationBell;