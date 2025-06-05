import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameRoom, ServerToClientEvents, ClientToServerEvents } from './types/game.types';
import { Game } from './game/Game';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Enable CORS for specified origins
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
  ],
  credentials: true,
}));

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173"
    ],
    methods: ["GET", "POST"],
    credentials: true,
  }
});

const rooms = new Map<string, GameRoom>();
const gameLoops = new Map<string, NodeJS.Timeout>();
const playerRooms = new Map<string, string>(); // socketId -> roomId
const playerSides = new Map<string, 'left' | 'right'>(); // socketId -> side

function createRoom(roomId: string): GameRoom {
  return {
    id: roomId,
    players: { left: undefined, right: undefined },
    gameState: Game.createInitialGameState(),
    lastUpdate: Date.now(),
  };
}

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function startGameLoop(roomId: string): void {
  if (gameLoops.has(roomId)) {
    clearInterval(gameLoops.get(roomId)!);
  }

  console.log(`Starting game loop for room ${roomId}`);

  const loop = setInterval(() => {
    const room = rooms.get(roomId);
    if (!room) {
      console.log(`Room ${roomId} not found, stopping game loop`);
      clearInterval(loop);
      gameLoops.delete(roomId);
      return;
    }

    // Only update ball if game started, not over, and both players present
    if (
      room.players.left && room.players.right &&
      room.gameState.gameStarted && !room.gameState.gameOver
    ) {
      const gameEnded = Game.updateBall(room.gameState);

      // Emit game state update to all players in the room
      io.to(roomId).emit('gameStateUpdate', room.gameState);

      if (gameEnded) {
        console.log(`Game ended in room ${roomId}, winner: ${room.gameState.winner}`);
        io.to(roomId).emit('gameEnded', room.gameState.winner!);
      }
    }
  }, 1000 / 60); // 60 FPS

  gameLoops.set(roomId, loop);
}

function cleanupPlayer(socketId: string): void {
  const roomId = playerRooms.get(socketId);
  if (!roomId) return;

  console.log(`Cleaning up player ${socketId} from room ${roomId}`);

  const room = rooms.get(roomId);
  if (!room) {
    playerRooms.delete(socketId);
    playerSides.delete(socketId);
    return;
  }

  // Remove player from room
  if (room.players.left === socketId) {
    room.players.left = undefined;
    console.log(`Left player removed from room ${roomId}`);
  }
  if (room.players.right === socketId) {
    room.players.right = undefined;
    console.log(`Right player removed from room ${roomId}`);
  }

  playerRooms.delete(socketId);
  playerSides.delete(socketId);

  // If room empty, clean it up
  if (!room.players.left && !room.players.right) {
    console.log(`Room ${roomId} is empty, cleaning up`);
    rooms.delete(roomId);
    if (gameLoops.has(roomId)) {
      clearInterval(gameLoops.get(roomId)!);
      gameLoops.delete(roomId);
    }
  } else {
    // Notify remaining player(s)
    room.gameState.gameStarted = false;
    room.gameState.gameOver = false;
    io.to(roomId).emit('playerDisconnected');
    io.to(roomId).emit('gameStateUpdate', room.gameState);
  }
}

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('createRoom', () => {
    const roomId = generateRoomId();
    const room = createRoom(roomId);
    rooms.set(roomId, room);

    room.players.left = socket.id;
    socket.join(roomId);
    playerRooms.set(socket.id, roomId);
    playerSides.set(socket.id, 'left');

    socket.emit('roomCreated', roomId);
    socket.emit('playerJoined', 'left');
    socket.emit('gameStateUpdate', room.gameState);

    console.log(`Room ${roomId} created by player ${socket.id} (left side)`);
  });

  socket.on('joinRoom', (roomId) => {
    console.log(`Player ${socket.id} joining room ${roomId}`);

    // Clean up any prior room association
    cleanupPlayer(socket.id);

    let room = rooms.get(roomId);
    if (!room) {
      room = createRoom(roomId);
      rooms.set(roomId, room);
      console.log(`Created new room ${roomId} for joining player`);
    }

    if (room.players.left && room.players.right) {
      console.log(`Room ${roomId} is full`);
      socket.emit('roomFull');
      return;
    }

    let side: 'left' | 'right';
    if (!room.players.left) {
      room.players.left = socket.id;
      side = 'left';
    } else {
      room.players.right = socket.id;
      side = 'right';
    }

    socket.join(roomId);
    playerRooms.set(socket.id, roomId);
    playerSides.set(socket.id, side);

    socket.emit('playerJoined', side);
    socket.emit('gameStateUpdate', room.gameState);

    console.log(`Player ${socket.id} joined room ${roomId} as ${side} player`);

    // Start game if both players present and game not started
    if (room.players.left && room.players.right && !room.gameState.gameStarted) {
      console.log(`Starting game in room ${roomId} - both players present`);
      room.gameState.gameStarted = true;
      io.to(roomId).emit('gameStarted');
      io.to(roomId).emit('gameStateUpdate', room.gameState);
      startGameLoop(roomId);
    }
  });

  socket.on('playerInput', (input) => {
    const roomId = playerRooms.get(socket.id);
    const side = playerSides.get(socket.id);

    console.log(`Player input received:`, { 
      socketId: socket.id, 
      roomId, 
      side, 
      input,
      hasRoom: !!rooms.get(roomId || ''),
      gameStarted: rooms.get(roomId || '')?.gameState.gameStarted,
      gameOver: rooms.get(roomId || '')?.gameState.gameOver
    });

    if (!roomId || !side) {
      console.log(`Player ${socket.id} not in room or no side assigned`);
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      console.log(`Room ${roomId} not found`);
      return;
    }

    if (!room.gameState.gameStarted || room.gameState.gameOver) {
      console.log(`Game not started or game over in room ${roomId}`);
      return;
    }

    // Store old paddle position for debugging
    const oldY = room.gameState.paddles[side].y;

    // Update paddle based on input
    Game.updatePaddle(room.gameState, side, input);

    // Log the change
    const newY = room.gameState.paddles[side].y;
    console.log(`Paddle ${side} moved from ${oldY} to ${newY} (direction: ${input.direction})`);

    // Broadcast updated game state immediately
    io.to(roomId).emit('gameStateUpdate', room.gameState);
  });

  socket.on('restartGame', () => {
    const roomId = playerRooms.get(socket.id);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    console.log(`Restarting game in room ${roomId}`);

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
    console.log(`Player disconnected: ${socket.id}`);
    cleanupPlayer(socket.id);
  });
});

app.get('/', (req, res) => {
  res.send('Multiplayer Pong Server is running!');
});

// Debug endpoint to check server state
app.get('/debug', (req, res) => {
  const debug = {
    rooms: Array.from(rooms.keys()),
    playerRooms: Object.fromEntries(playerRooms),
    playerSides: Object.fromEntries(playerSides),
    gameLoops: Array.from(gameLoops.keys()),
    roomDetails: Object.fromEntries(
      Array.from(rooms.entries()).map(([id, room]) => [
        id,
        {
          players: room.players,
          gameStarted: room.gameState.gameStarted,
          gameOver: room.gameState.gameOver,
          paddlePositions: {
            left: room.gameState.paddles.left.y,
            right: room.gameState.paddles.right.y
          }
        }
      ])
    )
  };
  res.json(debug);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});