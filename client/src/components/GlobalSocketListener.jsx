import { useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { useToast } from '../contexts/ToastContext';

const GlobalSocketListener = () => {
    const { socket } = useSocket();
    const { showToast } = useToast();

    useEffect(() => {
        if (!socket) return;

        // The handler function that triggers the toast
        const handleNotification = (data) => {
            showToast(data.message, data.type || 'info');
        };

        // Listen for the event emitted from the backend
        socket.on('new-notification', handleNotification);

        // Cleanup listener on unmount to prevent duplicate toasts
        return () => {
            socket.off('new-notification', handleNotification);
        };
    }, [socket, showToast]);

    // This component renders nothing visually, it just runs logic in the background
    return null;
};

export default GlobalSocketListener;