import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';

/**
 * Headless component that listens for global socket events 
 * and triggers UI toast notifications across the entire app.
 */
const GlobalNotificationListener = () => {
    const { socket } = useSocket();
    const { showToast } = useToast();

    useEffect(() => {
        // If the socket isn't connected yet (e.g., user is logged out), do nothing.
        if (!socket) return;

        // The handler function that fires when the backend calls emitToUser()
        const handleNewNotification = (data) => {
            // data matches the payload from our backend: { message: String, type: String }
            showToast(data.message, data.type || 'info');

            // Note: If you add a "Notification Bell" dropdown later with an unread count, 
            // you would also dispatch a state update here to increment that count!
        };

        // Attach the listener to the specific event name we used in the controllers
        socket.on('new-notification', handleNewNotification);

        // PERFECT CLEANUP: Prevent duplicate toasts firing if the component re-renders
        return () => {
            socket.off('new-notification', handleNewNotification);
        };
    }, [socket, showToast]);

    // Render nothing. This component purely manages logic.
    return null;
};

export default GlobalNotificationListener;