// Shared types for both client and server
export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface PaddleState {
  id: string;
  position: Position;
  width: number;
  height: number;
  player: 'left' | 'right';
}

export interface BallState {
  position: Position;
  velocity: Velocity;
  radius: number;
}

export interface GameState {
  id: string;
  players: {
    left: string | null;
    right: string | null;
  };
  paddles: {
    left: PaddleState;
    right: PaddleState;
  };
  ball: BallState;
  score: {
    left: number;
    right: number;
  };
  gameArea: {
    width: number;
    height: number;
  };
  isPlaying: boolean;
  winner: 'left' | 'right' | null;
}

export interface PlayerInput {
  playerId: string;
  direction: 'up' | 'down' | 'stop';
}

// Socket event types
export interface ServerToClientEvents {
  'game-state': (gameState: GameState) => void;
  'player-joined': (playerId: string, position: 'left' | 'right') => void;
  'player-left': (playerId: string) => void;
  'game-started': () => void;
  'game-ended': (winner: 'left' | 'right') => void;
  'waiting-for-player': () => void;
  'room-full': () => void;
}

export interface ClientToServerEvents {
  'join-game': () => void;
  'player-input': (input: PlayerInput) => void;
  'restart-game': () => void;
}

export const GAME_CONFIG = {
  GAME_WIDTH: 800,
  GAME_HEIGHT: 400,
  PADDLE_WIDTH: 10,
  PADDLE_HEIGHT: 80,
  PADDLE_SPEED: 5,
  BALL_RADIUS: 8,
  BALL_SPEED: 4,
  WINNING_SCORE: 5,
  TICK_RATE: 60, // FPS
};