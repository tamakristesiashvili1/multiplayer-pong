export interface GameState {
  ball: {
    x: number;
    y: number;
    dx: number;
    dy: number;
  };
  paddles: {
    left: {
      y: number;
      score: number;
    };
    right: {
      y: number;
      score: number;
    };
  };
  gameWidth: number;
  gameHeight: number;
  paddleHeight: number;
  paddleWidth: number;
  ballSize: number;
  gameStarted: boolean;
  gameOver: boolean;
  winner?: 'left' | 'right';
}

export interface PlayerInput {
  direction: 'up' | 'down' | 'stop';
}

export interface GameRoom {
  id: string;
  players: {
    left?: string;
    right?: string;
  };
  gameState: GameState;
  lastUpdate: number;
}

export interface ServerToClientEvents {
  gameStateUpdate: (gameState: GameState) => void;
  playerJoined: (side: 'left' | 'right') => void;
  gameStarted: () => void;
  gameEnded: (winner: 'left' | 'right') => void;
  roomFull: () => void;
  playerDisconnected: () => void;
  roomCreated: (roomId: string) => void;
}

export interface ClientToServerEvents {
  joinRoom: (roomId: string) => void;
  createRoom: () => void;
  playerInput: (input: PlayerInput) => void;
  restartGame: () => void;
}