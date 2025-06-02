import React from 'react';

interface PaddleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  isPlayer: boolean;
}

export const Paddle: React.FC<PaddleProps> = ({ x, y, width, height, isPlayer }) => {
  return (
    <div
      className={`paddle ${isPlayer ? 'player-paddle' : 'opponent-paddle'}`}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: isPlayer ? '#4CAF50' : 'white',
        borderRadius: '2px'
      }}
    />
  );
};