import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types/game.types';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    // Create socket connection
    socketRef.current = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return socketRef.current;
};