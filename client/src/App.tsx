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

    socket.on('gameStateUpdate', (newGameState: GameState) => {
      setGameState(newGameState);
    });

    socket.on('playerJoined', (side: 'left' | 'right') => {
      setPlayerSide(side);
      setGameStatus(`You are the ${side} player. Waiting for opponent...`);
    });

    socket.on('gameStarted', () => {
      setGameStatus('Game started! Use W/S or Arrow Keys to move your paddle.');
    });

    socket.on('gameEnded', (winner: 'left' | 'right') => {
      const isWinner = winner === playerSide;
      setGameStatus(`Game Over! ${isWinner ? 'You win!' : 'You lose!'} Press R to restart.`);
    });

    socket.on('roomFull', () => {
      setGameStatus('Room is full! Try a different room.');
    });

    socket.on('playerDisconnected', () => {
      setGameStatus('Other player disconnected. Waiting for new player...');
    });

    socket.on('roomCreated', (newRoomId: string) => {
      setCurrentRoomId(newRoomId);
      setGameStatus(`Room ${newRoomId} created! Share this room ID with your friend.`);
    });

    return () => {
      socket.off('gameStateUpdate');
      socket.off('playerJoined');
      socket.off('gameStarted');
      socket.off('gameEnded');
      socket.off('roomFull');
      socket.off('playerDisconnected');
      socket.off('roomCreated');
    };
  }, [socket, playerSide]);

  // Handle keyboard input
  const sendPlayerInput = useCallback((direction: 'up' | 'down' | 'stop') => {
    if (socket && gameState?.gameStarted && !gameState?.gameOver) {
      const input: PlayerInput = { direction };
      socket.emit('playerInput', input);
    }
  }, [socket, gameState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      if (keysPressed.has(key)) return; // Prevent key repeat
      
      setKeysPressed(prev => new Set(prev).add(key));

      if ((key === 'w' || key === 'arrowup') && playerSide === 'left') {
        sendPlayerInput('up');
      } else if ((key === 's' || key === 'arrowdown') && playerSide === 'left') {
        sendPlayerInput('down');
      } else if ((key === 'arrowup') && playerSide === 'right') {
        sendPlayerInput('up');
      } else if ((key === 'arrowdown') && playerSide === 'right') {
        sendPlayerInput('down');
      } else if (key === 'r' && gameState?.gameOver) {
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

      if (((key === 'w' || key === 's') && playerSide === 'left') ||
          ((key === 'arrowup' || key === 'arrowdown') && playerSide === 'right')) {
        sendPlayerInput('stop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerSide, sendPlayerInput, gameState, socket, keysPressed]);

  const createRoom = () => {
    if (socket) {
      socket.emit('createRoom');
    }
  };

  const joinRoom = () => {
    if (socket && roomId.trim()) {
      setCurrentRoomId(roomId.trim());
      socket.emit('joinRoom', roomId.trim());
      setGameStatus('Joining room...');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Multiplayer Pong</h1>
        
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
            <p>Room ID: <strong>{currentRoomId}</strong></p>
          </div>
        )}

        <div className="game-status">
          <p>{gameStatus}</p>
        </div>

        {gameState && (
          <>
            <GameBoard gameState={gameState} playerSide={playerSide} />
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