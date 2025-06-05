import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ClientToServerEvents, ServerToClientEvents } from '../types/game.types';

// Fixed: Changed port from 3000 to 3001 to match server
const SERVER_URL = 'http://localhost:3001';

export const useSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> | null => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [socketInstance, setSocketInstance] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;
    setSocketInstance(socket);

    socket.on('connect', () => {
      console.log('Connected to server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socketInstance;
};