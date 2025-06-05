import React, { useState, useEffect, useCallback } from 'react';
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
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());

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
      setGameStatus('Game started! Use W/S or Arrow Keys to move your paddle.');
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
      const key = event.key.toLowerCase();
      
      console.log(`Key pressed: ${key}, Player side: ${playerSide}`);

      // Prevent repeated calls on holding key
      if (keysPressed.has(key)) return;
      setKeysPressed(prev => new Set(prev).add(key));

      // Left player controls: W/S
      if (playerSide === 'left') {
        if (key === 'w') {
          console.log('Left player moving up');
          sendPlayerInput('up');
          return;
        }
        if (key === 's') {
          console.log('Left player moving down');
          sendPlayerInput('down');
          return;
        }
      }

      // Right player controls: ArrowUp/ArrowDown
      if (playerSide === 'right') {
        if (key === 'arrowup') {
          console.log('Right player moving up');
          sendPlayerInput('up');
          return;
        }
        if (key === 'arrowdown') {
          console.log('Right player moving down');
          sendPlayerInput('down');
          return;
        }
      }

      // Restart game on 'r' if game over
      if (key === 'r' && gameState?.gameOver) {
        console.log('Restarting game');
        socket?.emit('restartGame');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      setKeysPressed(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      // Left player stops moving when W or S released
      if (playerSide === 'left' && (key === 'w' || key === 's')) {
        console.log('Left player stopping');
        sendPlayerInput('stop');
        return;
      }

      // Right player stops moving when arrow keys released
      if (playerSide === 'right' && (key === 'arrowup' || key === 'arrowdown')) {
        console.log('Right player stopping');
        sendPlayerInput('stop');
      }
    };

    // Add event listeners to document to ensure they always work
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysPressed, playerSide, sendPlayerInput, gameState, socket]);

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
          Game Started: {gameState?.gameStarted ? 'Yes' : 'No'}
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
                {playerSide === 'left' ? 'Use W/S keys to move' : 'Use Arrow Keys to move'}
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