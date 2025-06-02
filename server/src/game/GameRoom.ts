import { GameState, PlayerInput } from '../types/game.types';

export class Game {
  public id: string;
  public players: { left?: string; right?: string } = {};
  public gameState: GameState;

  private static readonly GAME_WIDTH = 800;
  private static readonly GAME_HEIGHT = 400;
  private static readonly PADDLE_HEIGHT = 80;
  private static readonly PADDLE_WIDTH = 10;
  private static readonly BALL_SIZE = 10;
  private static readonly PADDLE_SPEED = 8;
  private static readonly BALL_SPEED = 5;
  private lastUpdate: number = Date.now();

  constructor(id: string) {
    this.id = id;
    this.gameState = this.createInitialGameState();
  }

  private createInitialGameState(): GameState {
    return {
      ball: {
        x: Game.GAME_WIDTH / 2,
        y: Game.GAME_HEIGHT / 2,
        dx: Math.random() > 0.5 ? Game.BALL_SPEED : -Game.BALL_SPEED,
        dy: (Math.random() - 0.5) * Game.BALL_SPEED
      },
      paddles: {
        left: {
          y: Game.GAME_HEIGHT / 2 - Game.PADDLE_HEIGHT / 2,
          score: 0
        },
        right: {
          y: Game.GAME_HEIGHT / 2 - Game.PADDLE_HEIGHT / 2,
          score: 0
        }
      },
      gameWidth: Game.GAME_WIDTH,
      gameHeight: Game.GAME_HEIGHT,
      paddleHeight: Game.PADDLE_HEIGHT,
      paddleWidth: Game.PADDLE_WIDTH,
      ballSize: Game.BALL_SIZE,
      gameStarted: false,
      gameOver: false
    };
  }

  public isFull(): boolean {
    return !!(this.players.left && this.players.right);
  }

  public isEmpty(): boolean {
    return !this.players.left && !this.players.right;
  }

  public addPlayer(playerId: string): 'left' | 'right' | null {
    if (!this.players.left) {
      this.players.left = playerId;
      return 'left';
    }
    if (!this.players.right) {
      this.players.right = playerId;
      return 'right';
    }
    return null; // Game full
  }

  public removePlayer(playerId: string): void {
    if (this.players.left === playerId) {
      delete this.players.left;
    }
    if (this.players.right === playerId) {
      delete this.players.right;
    }
  }

  public canStart(): boolean {
    return this.players.left !== undefined && this.players.right !== undefined;
  }

  public startGame(): void {
    this.gameState.gameStarted = true;
    this.gameState.gameOver = false;
    this.gameState.winner = undefined;
    this.gameState.ball.x = Game.GAME_WIDTH / 2;
    this.gameState.ball.y = Game.GAME_HEIGHT / 2;
    this.gameState.ball.dx = Math.random() > 0.5 ? Game.BALL_SPEED : -Game.BALL_SPEED;
    this.gameState.ball.dy = (Math.random() - 0.5) * Game.BALL_SPEED;
    this.lastUpdate = Date.now();
  }

  public handlePlayerInput(playerId: string, input: PlayerInput): void {
    let side: 'left' | 'right' | null = null;
    if (this.players.left === playerId) side = 'left';
    else if (this.players.right === playerId) side = 'right';
    if (!side) return;

    // Update paddle position
    if (input.direction === 'up') {
      this.gameState.paddles[side].y = Math.max(0, this.gameState.paddles[side].y - Game.PADDLE_SPEED);
    } else if (input.direction === 'down') {
      this.gameState.paddles[side].y = Math.min(
        this.gameState.gameHeight - this.gameState.paddleHeight,
        this.gameState.paddles[side].y + Game.PADDLE_SPEED
      );
    }

    this.lastUpdate = Date.now();
  }

  public update(): void {
    if (!this.gameState.gameStarted || this.gameState.gameOver) return;

    const { ball, paddles, gameWidth, gameHeight, paddleHeight, ballSize } = this.gameState;

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y <= 0 || ball.y >= gameHeight - ballSize) {
      ball.dy = -ball.dy;
      ball.y = Math.max(0, Math.min(gameHeight - ballSize, ball.y));
    }

    // Left paddle collision
    if (
      ball.x <= Game.PADDLE_WIDTH &&
      ball.y + ballSize >= paddles.left.y &&
      ball.y <= paddles.left.y + paddleHeight &&
      ball.dx < 0
    ) {
      ball.dx = Math.abs(ball.dx);
      ball.x = Game.PADDLE_WIDTH;
      const hitPos = (ball.y + ballSize / 2 - paddles.left.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * Game.BALL_SPEED * 1.5;
    }

    // Right paddle collision
    if (
      ball.x + ballSize >= gameWidth - Game.PADDLE_WIDTH &&
      ball.y + ballSize >= paddles.right.y &&
      ball.y <= paddles.right.y + paddleHeight &&
      ball.dx > 0
    ) {
      ball.dx = -Math.abs(ball.dx);
      ball.x = gameWidth - Game.PADDLE_WIDTH - ballSize;
      const hitPos = (ball.y + ballSize / 2 - paddles.right.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * Game.BALL_SPEED * 1.5;
    }

    if (ball.x < 0) {
      paddles.right.score++;
      this.resetBall();
      this.checkWin();
    }

    if (ball.x > gameWidth) {
      paddles.left.score++;
      this.resetBall();
      this.checkWin();
    }

    this.lastUpdate = Date.now();
  }

  private resetBall(): void {
    this.gameState.ball.x = this.gameState.gameWidth / 2;
    this.gameState.ball.y = this.gameState.gameHeight / 2;
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.gameState.ball.dx = Math.cos(angle) * Game.BALL_SPEED * direction;
    this.gameState.ball.dy = Math.sin(angle) * Game.BALL_SPEED;
  }

  private checkWin(): void {
    const winningScore = 5;
    if (this.gameState.paddles.left.score >= winningScore) {
      this.gameState.gameOver = true;
      this.gameState.winner = 'left';
    } else if (this.gameState.paddles.right.score >= winningScore) {
      this.gameState.gameOver = true;
      this.gameState.winner = 'right';
    }
  }

  public getLastUpdate(): number {
    return this.lastUpdate;
  }
}
