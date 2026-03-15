import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../hooks/useAuth'; // Adjust path if necessary

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Assumes you have the logged-in user here

    useEffect(() => {
        // 1. Guard clause: Only establish a connection if the user has a valid ID
        if (!user || !user._id) {
            setSocket(null);
            return;
        }

        // Replace with your actual backend URL or env variable
        const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

        // 2. Initialize the Socket Connection
        const socketInstance = io(backendUrl, {
            query: { userId: user._id },
            transports: ['websocket'], // PERFORMANCE BOOST: Skip HTTP long-polling
            autoConnect: true
        });

        // 3. Setup listeners for debugging
        socketInstance.on('connect', () => {
            console.log('✅ Connected to WebSocket server:', socketInstance.id);
        });

        socketInstance.on('connect_error', (err) => {
            console.error('❌ WebSocket Connection Error:', err.message);
        });

        // 4. Save to state so the rest of the app can use it
        setSocket(socketInstance);

        // 5. Perfect Cleanup: Disconnects automatically on unmount or when `user` changes (logout)
        return () => {
            socketInstance.off('connect');
            socketInstance.off('connect_error');
            socketInstance.disconnect();
        };
    }, [user]); // Re-run strictly when the user logs in or out

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};