

import React from 'react';
import { GameState } from '../types/game.types';
import { Ball } from './Ball';
import { Paddle } from './Paddle';
import { ScoreBoard } from './ScoreBoard';

interface GameBoardProps {
  gameState: GameState;
  playerSide: 'left' | 'right' | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, playerSide }) => {
  const { gameWidth, gameHeight, ball, paddles, paddleWidth, paddleHeight, ballSize } = gameState;

  return (
    <div className="game-container">
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
          backgroundColor: '#000',
          margin: '20px auto'
        }}
      >
        {/* Center line */}
        <div 
          className="center-line"
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: '2px',
            height: '100%',
            backgroundColor: 'white',
            opacity: 0.5,
            transform: 'translateX(-50%)'
          }}
        />

        {/* Left Paddle */}
        <Paddle
          x={0}
          y={paddles.left.y}
          width={paddleWidth}
          height={paddleHeight}
          isPlayer={playerSide === 'left'}
        />

        {/* Right Paddle */}
        <Paddle
          x={gameWidth - paddleWidth}
          y={paddles.right.y}
          width={paddleWidth}
          height={paddleHeight}
          isPlayer={playerSide === 'right'}
        />

        {/* Ball */}
        <Ball
          x={ball.x}
          y={ball.y}
          size={ballSize}
        />

        {/* Game Over Overlay */}
        {gameState.gameOver && (
          <div 
            className="game-over-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div>Game Over!</div>
              <div style={{ fontSize: '18px', marginTop: '10px' }}>
                {gameState.winner === playerSide ? 'You Win!' : 'You Lose!'}
              </div>
              <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
                Press R to restart
              </div>
            </div>
          </div>
        )}

        {/* Waiting for players overlay */}
        {!gameState.gameStarted && (
          <div 
            className="waiting-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px'
            }}
          >
            Waiting for players...
          </div>
        )}
      </div>
    </div>
  );
};