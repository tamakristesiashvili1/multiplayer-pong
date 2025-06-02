import { PlayerInput, GAME_CONFIG } from '../types/game.types';

export class Paddle {
  private y: number;
  private readonly side: 'left' | 'right';
  private velocity: number = 0;

  constructor(side: 'left' | 'right', initialY: number) {
    this.side = side;
    this.y = initialY;
  }

  public setDirection(direction: PlayerInput['direction']): void {
    switch (direction) {
      case 'up':
        this.velocity = -GAME_CONFIG.PADDLE_SPEED;
        break;
      case 'down':
        this.velocity = GAME_CONFIG.PADDLE_SPEED;
        break;
      case 'stop':
        this.velocity = 0;
        break;
    }
  }

  public update(gameHeight: number, paddleHeight: number): void {
    this.y += this.velocity;
    if (this.y < 0) this.y = 0;
    if (this.y > gameHeight - paddleHeight) this.y = gameHeight - paddleHeight;
  }

  public getY(): number {
    return this.y;
  }

  public reset(gameHeight: number, paddleHeight: number): void {
    this.y = gameHeight / 2 - paddleHeight / 2;
    this.velocity = 0;
  }

  public getSide(): 'left' | 'right' {
    return this.side;
  }
}
