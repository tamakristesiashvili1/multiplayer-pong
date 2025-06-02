import { GameState, PlayerInput, GAME_CONFIG } from '../types/game.types';

export class Game {
  static createInitialGameState(): GameState {
    return {
      ball: {
        x: GAME_CONFIG.GAME_WIDTH / 2,
        y: GAME_CONFIG.GAME_HEIGHT / 2,
        dx: Math.random() > 0.5 ? GAME_CONFIG.BALL_SPEED : -GAME_CONFIG.BALL_SPEED,
        dy: (Math.random() - 0.5) * GAME_CONFIG.BALL_SPEED
      },
      paddles: {
        left: {
          y: GAME_CONFIG.GAME_HEIGHT / 2 - GAME_CONFIG.PADDLE_HEIGHT / 2,
          score: 0
        },
        right: {
          y: GAME_CONFIG.GAME_HEIGHT / 2 - GAME_CONFIG.PADDLE_HEIGHT / 2,
          score: 0
        }
      },
      gameWidth: GAME_CONFIG.GAME_WIDTH,
      gameHeight: GAME_CONFIG.GAME_HEIGHT,
      paddleHeight: GAME_CONFIG.PADDLE_HEIGHT,
      paddleWidth: GAME_CONFIG.PADDLE_WIDTH,
      ballSize: GAME_CONFIG.BALL_RADIUS * 2,
      gameStarted: false,
      gameOver: false
    };
  }

  static updatePaddle(gameState: GameState, side: 'left' | 'right', input: PlayerInput): void {
    const paddle = gameState.paddles[side];
    
    if (input.direction === 'up') {
      paddle.y = Math.max(0, paddle.y - GAME_CONFIG.PADDLE_SPEED);
    } else if (input.direction === 'down') {
      paddle.y = Math.min(
        gameState.gameHeight - gameState.paddleHeight,
        paddle.y + GAME_CONFIG.PADDLE_SPEED
      );
    }
  }

  static updateBall(gameState: GameState): boolean {
    if (!gameState.gameStarted || gameState.gameOver) return false;

    const { ball, paddles, gameWidth, gameHeight, paddleHeight } = gameState;
    
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Bounce off top and bottom
    if (ball.y <= 0 || ball.y >= gameHeight - GAME_CONFIG.BALL_RADIUS * 2) {
      ball.dy = -ball.dy;
      ball.y = Math.max(0, Math.min(gameHeight - GAME_CONFIG.BALL_RADIUS * 2, ball.y));
    }

    // Left paddle collision
    if (
      ball.x <= GAME_CONFIG.PADDLE_WIDTH &&
      ball.y + GAME_CONFIG.BALL_RADIUS * 2 >= paddles.left.y &&
      ball.y <= paddles.left.y + paddleHeight &&
      ball.dx < 0
    ) {
      ball.dx = Math.abs(ball.dx);
      ball.x = GAME_CONFIG.PADDLE_WIDTH;
      const hitPos = (ball.y + GAME_CONFIG.BALL_RADIUS - paddles.left.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * GAME_CONFIG.BALL_SPEED * 1.5;
    }

    // Right paddle collision
    if (
      ball.x + GAME_CONFIG.BALL_RADIUS * 2 >= gameWidth - GAME_CONFIG.PADDLE_WIDTH &&
      ball.y + GAME_CONFIG.BALL_RADIUS * 2 >= paddles.right.y &&
      ball.y <= paddles.right.y + paddleHeight &&
      ball.dx > 0
    ) {
      ball.dx = -Math.abs(ball.dx);
      ball.x = gameWidth - GAME_CONFIG.PADDLE_WIDTH - GAME_CONFIG.BALL_RADIUS * 2;
      const hitPos = (ball.y + GAME_CONFIG.BALL_RADIUS - paddles.right.y) / paddleHeight;
      ball.dy = (hitPos - 0.5) * GAME_CONFIG.BALL_SPEED * 1.5;
    }

    // Scoring
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
    gameState.ball.x = GAME_CONFIG.GAME_WIDTH / 2;
    gameState.ball.y = GAME_CONFIG.GAME_HEIGHT / 2;
    const angle = (Math.random() - 0.5) * (Math.PI / 3);
    const direction = Math.random() > 0.5 ? 1 : -1;
    gameState.ball.dx = Math.cos(angle) * GAME_CONFIG.BALL_SPEED * direction;
    gameState.ball.dy = Math.sin(angle) * GAME_CONFIG.BALL_SPEED;
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
    newState.gameStarted = true;
    Object.assign(gameState, newState);
  }
}
