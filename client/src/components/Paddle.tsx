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
        borderRadius: 8,
        backgroundColor: isPlayer ? '#00ffcc' : '#ffffff',
        boxShadow: isPlayer
          ? '0 0 12px 3px #00ffcc, inset 0 0 8px 1px #00bba6'
          : '0 0 10px 2px #aaaaaa, inset 0 0 5px 1px #dddddd',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        userSelect: 'none',
      }}
    />
  );
};
