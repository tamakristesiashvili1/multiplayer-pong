import { GameState, PlayerInput } from '../types/game.types';

export class Game {
  private static readonly GAME_WIDTH = 800;
  private static readonly GAME_HEIGHT = 400;
  private static readonly PADDLE_HEIGHT = 80;
  private static readonly PADDLE_WIDTH = 10;
  private static readonly BALL_SIZE = 10;
  private static readonly PADDLE_SPEED = 8;
  private static readonly BALL_SPEED = 5;

  static createInitialGameState(): GameState {
    return {
      ball: {
        x: this.GAME_WIDTH / 2,
        y: this.GAME_HEIGHT / 2,
        dx: Math.random() > 0.5 ? this.BALL_SPEED : -this.BALL_SPEED,
        dy: (Math.random() - 0.5) * this.BALL_SPEED
      },
      paddles: {
        left: {
          y: this.GAME_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
          score: 0
        },
        right: {
          y: this.GAME_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
          score: 0
        }
      },
      gameWidth: this.GAME_WIDTH,
      gameHeight: this.GAME_HEIGHT,
      paddleHeight: this.PADDLE_HEIGHT,
      paddleWidth: this.PADDLE_WIDTH,
      ballSize: this.BALL_SIZE,
      gameStarted: false,
      gameOver: false
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
    
    // Update ball position
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Ball collision with top and bottom walls
    if (ball.y <= 0 || ball.y >= gameHeight - ballSize) {
      ball.dy = -ball.dy;
      ball.y = Math.max(0, Math.min(gameHeight - ballSize, ball.y));
    }

    // Ball collision with left paddle
    if (ball.x <= this.PADDLE_WIDTH && 
        ball.y + ballSize >= paddles.left.y && 
        ball.y <= paddles.left.y + paddleHeight &&
        ball.dx < 0) {
      ball.dx = Math.abs(ball.dx);
      ball.x = this.PADDLE_WIDTH;
      // Add some spin based on where the ball hits the paddle
      const hitPos = (ball.y + ballSize/2 - paddles.left.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * this.BALL_SPEED * 1.5;
    }

    // Ball collision with right paddle
    if (ball.x + ballSize >= gameWidth - this.PADDLE_WIDTH && 
        ball.y + ballSize >= paddles.right.y && 
        ball.y <= paddles.right.y + paddleHeight &&
        ball.dx > 0) {
      ball.dx = -Math.abs(ball.dx);
      ball.x = gameWidth - this.PADDLE_WIDTH - ballSize;
      // Add some spin based on where the ball hits the paddle
      const hitPos = (ball.y + ballSize/2 - paddles.right.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * this.BALL_SPEED * 1.5;
    }

    // Check for scoring
    if (ball.x < 0) {
      paddles.right.score++;
      this.resetBall(gameState);
      return this.checkWin(gameState);
    }

    if (ball.x > gameWidth) {
      paddles.left.score++;
      this.resetBall(gameState);
      return this.checkWin(gameState);
    }

    return false;
  }

  private static resetBall(gameState: GameState): void {
    gameState.ball.x = gameState.gameWidth / 2;
    gameState.ball.y = gameState.gameHeight / 2;
    // Random direction but not too steep
    const angle = (Math.random() - 0.5) * Math.PI / 3; // ±60 degrees max
    const direction = Math.random() > 0.5 ? 1 : -1;
    gameState.ball.dx = Math.cos(angle) * this.BALL_SPEED * direction;
    gameState.ball.dy = Math.sin(angle) * this.BALL_SPEED;
  }

  private static checkWin(gameState: GameState): boolean {
    const winningScore = 5;
    if (gameState.paddles.left.score >= winningScore) {
      gameState.gameOver = true;
      gameState.winner = 'left';
      return true;
    }
    if (gameState.paddles.right.score >= winningScore) {
      gameState.gameOver = true;
      gameState.winner = 'right';
      return true;
    }
    return false;
  }

  static restartGame(gameState: GameState): void {
    const newState = this.createInitialGameState();
    newState.gameStarted = true; // Keep game started when restarting
    Object.assign(gameState, newState);
  }
}