import React, { useEffect } from 'react';
import { GameState } from '../types/game.types';
import { Ball } from './Ball';
import { Paddle } from './Paddle';
import { ScoreBoard } from './ScoreBoard';
import { Socket } from 'socket.io-client';

interface GameBoardProps {
  gameState: GameState;
  playerSide: 'left' | 'right' | null;
  socket: Socket | null;  // socket prop added here, nullable for safety
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerSide, socket }) => {
  const { gameWidth, gameHeight, ball, paddles, paddleWidth, paddleHeight, ballSize } = gameState;

  useEffect(() => {
    if (!socket) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (typeof event.key !== 'string') return;
      const key = event.key.toLowerCase();

      if (key === 'w') {
        socket.emit('playerInput', { direction: 'up' });
      } else if (key === 's') {
        socket.emit('playerInput', { direction: 'down' });
      } else if (key === 'r' && gameState.gameOver) {
        socket.emit('restartGame');
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (typeof event.key !== 'string') return;
      const key = event.key.toLowerCase();

      if (key === 'w' || key === 's') {
        socket.emit('playerStop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [socket, gameState.gameOver]);

  return (
    <div className="game-container" style={{ maxWidth: gameWidth + 40, margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <ScoreBoard 
        leftScore={paddles.left.score} 
        rightScore={paddles.right.score}
        playerSide={playerSide}
      />
      
      <div 
        className="game-board"
        style={{
          width: gameWidth,
          height: gameHeight,
          position: 'relative',
          border: '2px solid white',
          backgroundColor: '#111',
          margin: '20px auto',
          borderRadius: '8px',
          boxShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          userSelect: 'none',
        }}
      >
        <div 
          className="center-line"
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: '4px',
            height: '100%',
            backgroundColor: 'white',
            opacity: 0.3,
            transform: 'translateX(-50%)',
            boxShadow: '0 0 10px white',
          }}
        />

        <Paddle
          x={0}
          y={paddles.left.y}
          width={paddleWidth}
          height={paddleHeight}
          isPlayer={playerSide === 'left'}
        />

        <Paddle
          x={gameWidth - paddleWidth}
          y={paddles.right.y}
          width={paddleWidth}
          height={paddleHeight}
          isPlayer={playerSide === 'right'}
        />

        <Ball
          x={ball.x}
          y={ball.y}
          size={ballSize}
        />

        {gameState.gameOver && (
          <div 
            className="game-over-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '28px',
              fontWeight: 'bold',
              flexDirection: 'column',
              textShadow: '0 0 10px #ff0000',
              padding: '0 20px',
              textAlign: 'center',
            }}
          >
            <div>Game Over!</div>
            <div style={{ fontSize: '20px', marginTop: '12px' }}>
              {gameState.winner === playerSide ? 'You Win!' : 'You Lose!'}
            </div>
            <div style={{ fontSize: '16px', marginTop: '15px', opacity: 0.7 }}>
              Press <kbd style={{ background: '#222', padding: '2px 6px', borderRadius: '4px' }}>R</kbd> to restart
            </div>
          </div>
        )}

        {!gameState.gameStarted && !gameState.gameOver && (
          <div 
            className="waiting-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontStyle: 'italic',
              userSelect: 'none',
            }}
          >
            Waiting for players...
          </div>
        )}
      </div>
    </div>
  );
};
