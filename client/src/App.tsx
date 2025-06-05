import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { GameBoard } from './components/GameBoard';
import { GameState, PlayerInput } from './types/game.types';
import './App.css';

function App() {
  const socket = useSocket();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerSide, setPlayerSide] = useState<'left' | 'right' | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<string>('Waiting to connect...');
  
  // Use useRef instead of useState for keysPressed to avoid stale closures
  const keysPressed = useRef<Set<string>>(new Set());

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const onGameStateUpdate = (newGameState: GameState) => {
      console.log('Game state updated:', newGameState);
      setGameState(newGameState);
    };
    
    const onPlayerJoined = (side: 'left' | 'right') => {
      console.log('Player joined as:', side);
      setPlayerSide(side);
      setGameStatus(`You are the ${side} player. Waiting for opponent...`);
    };
    
    const onGameStarted = () => {
      console.log('Game started!');
      setGameStatus('Game started! Use WASD or Arrow Keys to move your paddle.');
    };
    
    const onGameEnded = (winner: 'left' | 'right') => {
      const isWinner = winner === playerSide;
      setGameStatus(`Game Over! ${isWinner ? 'You win!' : 'You lose!'} Press R to restart.`);
    };
    
    const onRoomFull = () => {
      setGameStatus('Room is full! Try a different room.');
    };
    
    const onPlayerDisconnected = () => {
      setGameStatus('Other player disconnected. Waiting for new player...');
    };
    
    const onRoomCreated = (newRoomId: string) => {
      console.log('Room created:', newRoomId);
      setCurrentRoomId(newRoomId);
      setGameStatus(`Room ${newRoomId} created! Share this room ID with your friend.`);
    };

    socket.on('gameStateUpdate', onGameStateUpdate);
    socket.on('playerJoined', onPlayerJoined);
    socket.on('gameStarted', onGameStarted);
    socket.on('gameEnded', onGameEnded);
    socket.on('roomFull', onRoomFull);
    socket.on('playerDisconnected', onPlayerDisconnected);
    socket.on('roomCreated', onRoomCreated);

    return () => {
      socket.off('gameStateUpdate', onGameStateUpdate);
      socket.off('playerJoined', onPlayerJoined);
      socket.off('gameStarted', onGameStarted);
      socket.off('gameEnded', onGameEnded);
      socket.off('roomFull', onRoomFull);
      socket.off('playerDisconnected', onPlayerDisconnected);
      socket.off('roomCreated', onRoomCreated);
    };
  }, [socket, playerSide]);

  // Send player input to server
  const sendPlayerInput = useCallback(
    (direction: 'up' | 'down' | 'stop') => {
      if (socket && gameState?.gameStarted && !gameState.gameOver) {
        const input: PlayerInput = { direction };
        console.log(`Sending input: ${direction} (player: ${playerSide})`);
        socket.emit('playerInput', input);
      } else {
        console.log('Cannot send input:', {
          hasSocket: !!socket,
          gameStarted: gameState?.gameStarted,
          gameOver: gameState?.gameOver,
          playerSide
        });
      }
    },
    [socket, gameState, playerSide]
  );

  // Keyboard event handlers for paddle movement and restart
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for game keys
      if (['w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'r', 'R'].includes(event.key)) {
        event.preventDefault();
      }

      const key = event.key.toLowerCase();
      
      console.log(`Key pressed: ${key}, Player side: ${playerSide}`);

      // Prevent repeated calls on holding key
      if (keysPressed.current.has(key)) {
        console.log(`Key ${key} already pressed, ignoring repeat`);
        return;
      }
      
      keysPressed.current.add(key);

      // Movement controls for both players
      // W/S or ArrowUp/ArrowDown for vertical movement
      if (key === 'w' || key === 'arrowup') {
        console.log(`${playerSide} player moving up`);
        sendPlayerInput('up');
        return;
      }
      
      if (key === 's' || key === 'arrowdown') {
        console.log(`${playerSide} player moving down`);
        sendPlayerInput('down');
        return;
      }

      // Optional: A/D or ArrowLeft/ArrowRight could be used for special moves
      // For now, we'll just log them but not use them for movement
      if (key === 'a' || key === 'arrowleft') {
        console.log(`${playerSide} player pressed left (not used for movement)`);
        return;
      }
      
      if (key === 'd' || key === 'arrowright') {
        console.log(`${playerSide} player pressed right (not used for movement)`);
        return;
      }

      // Restart game on 'r' if game over
      if (key === 'r' && gameState?.gameOver) {
        console.log('Restarting game');
        socket?.emit('restartGame');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      console.log(`Key released: ${key}, Player side: ${playerSide}`);

      // Remove from pressed keys
      keysPressed.current.delete(key);

      // Only send stop if game is active
      if (!gameState?.gameStarted || gameState?.gameOver) {
        return;
      }

      // Send stop when any movement key is released
      if (['w', 's', 'arrowup', 'arrowdown'].includes(key)) {
        console.log(`${playerSide} player stopping`);
        sendPlayerInput('stop');
      }
    };

    // Add event listeners to window to ensure they always work
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerSide, sendPlayerInput, gameState, socket]);

  // Clear keys when game ends or player changes
  useEffect(() => {
    keysPressed.current.clear();
  }, [gameState?.gameOver, playerSide]);

  // Create a new room
  const createRoom = () => {
    if (socket) {
      console.log('Creating room...');
      socket.emit('createRoom');
    }
  };

  // Join an existing room by ID
  const joinRoom = () => {
    if (socket && roomId.trim()) {
      const trimmed = roomId.trim().toUpperCase();
      console.log('Joining room:', trimmed);
      setCurrentRoomId(trimmed);
      socket.emit('joinRoom', trimmed);
      setGameStatus('Joining room...');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Multiplayer Pong</h1>

        {/* Debug info */}
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          Socket: {socket ? 'Connected' : 'Disconnected'} | 
          Player: {playerSide || 'None'} | 
          Game Started: {gameState?.gameStarted ? 'Yes' : 'No'} |
          Keys Pressed: {Array.from(keysPressed.current).join(', ') || 'None'}
        </div>

        {!gameState && (
          <div className="room-controls">
            <div className="room-section">
              <button onClick={createRoom} className="create-room-btn">
                Create New Room
              </button>
            </div>

            <div className="room-section">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
                className="room-input"
                maxLength={6}
              />
              <button onClick={joinRoom} className="join-room-btn">
                Join Room
              </button>
            </div>
          </div>
        )}

        {currentRoomId && (
          <div className="room-info">
            <p>
              Room ID: <strong>{currentRoomId}</strong>
            </p>
          </div>
        )}

        <div className="game-status">
          <p>{gameStatus}</p>
        </div>

        {gameState && (
          <>
            <GameBoard gameState={gameState} playerSide={playerSide} socket={socket} />
            <div className="controls-info">
              <p>
                Use WASD or Arrow Keys to move your paddle
                {gameState.gameOver && ' | Press R to restart'}
              </p>
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;