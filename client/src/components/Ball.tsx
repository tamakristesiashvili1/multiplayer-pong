import React from 'react';

interface BallProps {
  x: number;
  y: number;
  size: number;
}

export const Ball: React.FC<BallProps> = ({ x, y, size }) => {
  return (
    <div
      className="ball"
      style={{
        position: 'absolute',
        left: `${x - size/2}px`,
        top: `${y - size/2}px`,
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: 'white',
        borderRadius: '50%'
      }}
    />
  );
};