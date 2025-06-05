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
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: width,
        height: height,
        borderRadius: 4,
        backgroundColor: isPlayer ? '#ff0000' : '#880000',
        boxShadow: isPlayer
          ? '0 0 12px 3px #ff0000, inset 0 0 8px 1px #990000'
          : '0 0 8px 2px #440000, inset 0 0 5px 1px #330000',
        border: '1px solid #ff4444',
        transition: 'background-color 0.2s ease',
      }}
    />
  );
};

