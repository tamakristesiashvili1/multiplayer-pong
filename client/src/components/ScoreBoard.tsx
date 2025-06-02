import React from 'react';

interface ScoreBoardProps {
  leftScore: number;
  rightScore: number;
  playerSide: 'left' | 'right' | null;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ leftScore, rightScore, playerSide }) => {
  const isLeft = playerSide === 'left';
  const isRight = playerSide === 'right';

  return (
    <div className="scoreboard">
      <div className={`score ${isLeft ? 'highlight' : ''}`}>
        {isLeft ? 'You' : 'Left'}: {leftScore}
      </div>
      <div className={`score ${isRight ? 'highlight' : ''}`}>
        {isRight ? 'You' : 'Right'}: {rightScore}
      </div>
    </div>
  );
};
