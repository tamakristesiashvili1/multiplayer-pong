import { GameState, PlayerInput } from '../types/game.types';

export class Game {
  public static readonly GAME_WIDTH = 800;
  public static readonly GAME_HEIGHT = 400;
  public static readonly PADDLE_HEIGHT = 80;
  public static readonly PADDLE_WIDTH = 10;
  public static readonly PADDLE_SPEED = 8;
  public static readonly BALL_SPEED = 5;
  public static readonly WINNING_SCORE = 5;
  private static readonly BALL_SPEED_INCREMENT = 0.3;

  static createInitialGameState(): GameState {
    return {
      ball: {
        x: this.GAME_WIDTH / 2,
        y: this.GAME_HEIGHT / 2,
        dx: Math.random() > 0.5 ? this.BALL_SPEED : -this.BALL_SPEED,
        dy: (Math.random() - 0.5) * this.BALL_SPEED,
      },
      paddles: {
        left: {
          y: this.GAME_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
          score: 0,
        },
        right: {
          y: this.GAME_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
          score: 0,
        },
      },
      gameWidth: this.GAME_WIDTH,
      gameHeight: this.GAME_HEIGHT,
      paddleHeight: this.PADDLE_HEIGHT,
      paddleWidth: this.PADDLE_WIDTH,
      ballSize: this.BALL_SIZE,
      gameStarted: false,
      gameOver: false,
    };
  }

  static updatePaddle(gameState: GameState, side: 'left' | 'right', input: PlayerInput): void {
    const paddle = gameState.paddles[side];
    if (input.direction === 'up') {
      paddle.y = Math.max(0, paddle.y - this.PADDLE_SPEED);
    } else if (input.direction === 'down') {
      paddle.y = Math.min(gameState.gameHeight - gameState.paddleHeight, paddle.y + this.PADDLE_SPEED);
    }
  }

  static updateBall(gameState: GameState): boolean {
    if (!gameState.gameStarted || gameState.gameOver) return false;

    const { ball, paddles, gameWidth, gameHeight, paddleHeight, ballSize } = gameState;
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top/bottom wall collision
    if (ball.y <= 0 || ball.y >= gameHeight - ballSize) {
      ball.dy = -ball.dy;
      ball.y = Math.max(0, Math.min(gameHeight - ballSize, ball.y));
    }

    // Left paddle
    if (
      ball.x <= this.PADDLE_WIDTH &&
      ball.y + ballSize >= paddles.left.y &&
      ball.y <= paddles.left.y + paddleHeight &&
      ball.dx < 0
    ) {
      ball.dx = Math.abs(ball.dx) + this.BALL_SPEED_INCREMENT;
      ball.x = this.PADDLE_WIDTH;
      const hitPos = (ball.y + ballSize / 2 - paddles.left.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * this.BALL_SPEED * 1.5;
    }

    // Right paddle
    if (
      ball.x + ballSize >= gameWidth - this.PADDLE_WIDTH &&
      ball.y + ballSize >= paddles.right.y &&
      ball.y <= paddles.right.y + paddleHeight &&
      ball.dx > 0
    ) {
      ball.dx = -Math.abs(ball.dx) - this.BALL_SPEED_INCREMENT;
      ball.x = gameWidth - this.PADDLE_WIDTH - ballSize;
      const hitPos = (ball.y + ballSize / 2 - paddles.right.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * this.BALL_SPEED * 1.5;
    }

    // Score check
    if (ball.x < 0) {
      paddles.right.score++;
      this.resetBall(gameState, 'right');
      return this.checkWin(gameState);
    }

    if (ball.x > gameWidth) {
      paddles.left.score++;
      this.resetBall(gameState, 'left');
      return this.checkWin(gameState);
    }

    return false;
  }

  private static resetBall(gameState: GameState, directionTo: 'left' | 'right'): void {
    gameState.ball.x = gameState.gameWidth / 2;
    gameState.ball.y = gameState.gameHeight / 2;

    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const direction = directionTo === 'left' ? -1 : 1;
    const speed = this.BALL_SPEED;
    gameState.ball.dx = Math.cos(angle) * speed * direction;
    gameState.ball.dy = Math.sin(angle) * speed;
  }

  private static checkWin(gameState: GameState): boolean {
    if (gameState.paddles.left.score >= this.WINNING_SCORE) {
      gameState.gameOver = true;
      gameState.winner = 'left';
      return true;
    }
    if (gameState.paddles.right.score >= this.WINNING_SCORE) {
      gameState.gameOver = true;
      gameState.winner = 'right';
      return true;
    }
    return false;
  }

  static restartGame(gameState: GameState): void {
    const newState = this.createInitialGameState();
    newState.gameStarted = true;
    Object.assign(gameState, newState);
  }

  private static readonly BALL_SIZE = 10;
}
