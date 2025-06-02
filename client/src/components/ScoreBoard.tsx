import React from 'react';

interface ScoreBoardProps {
  leftScore: number;
  rightScore: number;
  playerSide: 'left' | 'right' | null;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ leftScore, rightScore, playerSide }) => {
  return (
    <div className="scoreboard" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '300px',
      margin: '0 auto 20px auto',
      color: 'white',
      fontSize: '24px',
      fontWeight: 'bold'
    }}>
      <div className={`score ${playerSide === 'left' ? 'player-score' : ''}`}>
        <span style={{ opacity: playerSide === 'left' ? 1 : 0.7 }}>
          {playerSide === 'left' ? 'YOU' : 'OPPONENT'}
        </span>
        <div style={{ fontSize: '32px', marginTop: '5px' }}>{leftScore}</div>
      </div>
      
      <div style={{ fontSize: '18px', opacity: 0.5 }}>VS</div>
      
      <div className={`score ${playerSide === 'right' ? 'player-score' : ''}`}>
        <span style={{ opacity: playerSide === 'right' ? 1 : 0.7 }}>
          {playerSide === 'right' ? 'YOU' : 'OPPONENT'}
        </span>
        <div style={{ fontSize: '32px', marginTop: '5px' }}>{rightScore}</div>
      </div>
    </div>
  );
};