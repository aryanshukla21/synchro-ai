import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Adjust path if necessary

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth(); // Assumes you have the logged-in user here

    useEffect(() => {
        // Only establish a connection if the user is authenticated
        if (user) {
            // Replace with your actual backend URL or env variable
            const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

            const socketInstance = io(backendUrl, {
                // Pass the user ID so the backend can assign them to a private room
                query: { userId: user._id }
            });

            socketInstance.on('connect', () => {
                console.log('Connected to WebSocket server:', socketInstance.id);
            });

            setSocket(socketInstance);

            // Cleanup function to disconnect when user logs out or unmounts
            return () => {
                socketInstance.disconnect();
            };
        } else if (socket) {
            socket.disconnect();
            setSocket(null);
        }
    }, [user]); // Re-run if user state changes

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};