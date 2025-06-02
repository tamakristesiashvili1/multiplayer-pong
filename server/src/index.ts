import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom, ServerToClientEvents, ClientToServerEvents } from './types/game.types';
import { Game } from './game/Game';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
  credentials: true
}));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const rooms = new Map<string, GameRoom>();
const gameLoops = new Map<string, NodeJS.Timeout>();
const playerRooms = new Map<string, string>(); // Track which room each player is in
const playerSides = new Map<string, 'left' | 'right'>(); // Track which side each player is on

function createRoom(roomId: string): GameRoom {
  const room: GameRoom = {
    id: roomId,
    players: {},
    gameState: Game.createInitialGameState(),
    lastUpdate: Date.now()
  };
  return room;
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function startGameLoop(roomId: string): void {
  if (gameLoops.has(roomId)) {
    clearInterval(gameLoops.get(roomId)!);
  }

  const gameLoop = setInterval(() => {
    const room = rooms.get(roomId);
    if (!room) {
      clearInterval(gameLoop);
      gameLoops.delete(roomId);
      return;
    }

    // Only update if both players are present and game is started
    if (room.players.left && room.players.right && room.gameState.gameStarted && !room.gameState.gameOver) {
      const gameEnded = Game.updateBall(room.gameState);
      
      // Emit updated game state to all players in the room
      io.to(roomId).emit('gameStateUpdate', room.gameState);
      
      if (gameEnded) {
        io.to(roomId).emit('gameEnded', room.gameState.winner!);
      }
    }
  }, 1000 / 60); // 60 FPS

  gameLoops.set(roomId, gameLoop);
}

function cleanupPlayer(socketId: string): void {
  const roomId = playerRooms.get(socketId);
  if (roomId) {
    const room = rooms.get(roomId);
    if (room) {
      // Remove player from room
      if (room.players.left === socketId) {
        room.players.left = undefined;
      }
      if (room.players.right === socketId) {
        room.players.right = undefined;
      }

      // If room is empty, clean it up
      if (!room.players.left && !room.players.right) {
        rooms.delete(roomId);
        if (gameLoops.has(roomId)) {
          clearInterval(gameLoops.get(roomId)!);
          gameLoops.delete(roomId);
        }
      } else {
        // Notify remaining player
        io.to(roomId).emit('playerDisconnected');
        room.gameState.gameStarted = false;
        room.gameState.gameOver = false;
      }
    }
    
    playerRooms.delete(socketId);
    playerSides.delete(socketId);
  }
}

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    const room = createRoom(roomId);
    rooms.set(roomId, room);
    
    // Add player to room as left player
    room.players.left = socket.id;
    socket.join(roomId);
    playerRooms.set(socket.id, roomId);
    playerSides.set(socket.id, 'left');
    
    socket.emit('roomCreated', roomId);
    socket.emit('playerJoined', 'left');
    
    console.log(`Room ${roomId} created by player ${socket.id}`);
  });

  socket.on('joinRoom', (roomId) => {
    console.log(`Player ${socket.id} attempting to join room ${roomId}`);
    
    // Clean up any previous room assignment
    cleanupPlayer(socket.id);
    
    let room = rooms.get(roomId);
    if (!room) {
      // Room doesn't exist, create it
      room = createRoom(roomId);
      rooms.set(roomId, room);
    }

    // Check if room is full
    if (room.players.left && room.players.right) {
      socket.emit('roomFull');
      return;
    }

    // Assign player to a side
    let playerSide: 'left' | 'right';
    if (!room.players.left) {
      room.players.left = socket.id;
      playerSide = 'left';
    } else {
      room.players.right = socket.id;
      playerSide = 'right';
    }

    socket.join(roomId);
    playerRooms.set(socket.id, roomId);
    playerSides.set(socket.id, playerSide);
    
    socket.emit('playerJoined', playerSide);
    
    // Send initial game state
    socket.emit('gameStateUpdate', room.gameState);
    
    // Start the game if both players are present
    if (room.players.left && room.players.right && !room.gameState.gameStarted) {
      room.gameState.gameStarted = true;
      io.to(roomId).emit('gameStarted');
      io.to(roomId).emit('gameStateUpdate', room.gameState);
      startGameLoop(roomId);
    }
  });

  socket.on('playerInput', (input) => {
    const roomId = playerRooms.get(socket.id);
    const playerSide = playerSides.get(socket.id);
    
    if (!roomId || !playerSide) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.gameState.gameStarted || room.gameState.gameOver) return;

    // Update paddle position
    Game.updatePaddle(room.gameState, playerSide, input);
    
    // Broadcast updated game state immediately for responsive controls
    io.to(roomId).emit('gameStateUpdate', room.gameState);
  });

  socket.on('restartGame', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;

    // Only restart if both players are present
    if (room.players.left && room.players.right) {
      Game.restartGame(room.gameState);
      io.to(roomId).emit('gameStarted');
      io.to(roomId).emit('gameStateUpdate', room.gameState);
      
      if (!gameLoops.has(roomId)) {
        startGameLoop(roomId);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    cleanupPlayer(socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Multiplayer Pong Server is running!');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});