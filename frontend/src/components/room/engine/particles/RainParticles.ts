// RainParticles — Window rain drops (R5.5-P4)
// ≤30 drops inside window area + 5 drip trails on glass
// Active only during rain weather

import { Particle } from './SteamParticles';

interface Raindrop extends Particle {
  isDrip: boolean;
  length: number;
}

export class RainParticleSystem {
  particles: Raindrop[] = [];
  maxParticles = 30;

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(i >= 25));
      this.particles[i].life = Math.random() * this.particles[i].maxLife;
    }
  }

  createParticle(isDrip = false): Raindrop {
    if (isDrip) {
      // Drip trail sliding slowly down the window glass
      return {
        x: 730 + Math.random() * 380,
        y: 60 + Math.random() * 200,
        vx: 0,
        vy: 12 + Math.random() * 15,
        opacity: 0.15 + Math.random() * 0.2,
        size: 1 + Math.random() * 1.5,
        life: 0,
        maxLife: 3 + Math.random() * 3,
        isDrip: true,
        length: 8 + Math.random() * 12,
      };
    } else {
      // Fast falling raindrop slanted by wind
      return {
        x: 710 + Math.random() * 450,
        y: 60,
        vx: -80 - Math.random() * 60, // slant left due to wind
        vy: 350 + Math.random() * 150, // fall fast
        opacity: 0.2 + Math.random() * 0.3,
        size: 1 + Math.random() * 1,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
        isDrip: false,
        length: 15 + Math.random() * 15,
      };
    }
  }

  update(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt;

      // Reset when lifetime ends or particle moves out of window bounds
      if (p.life >= p.maxLife || p.y > 390 || p.x < 710 || p.x > 1150) {
        this.particles[i] = this.createParticle(p.isDrip);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.isDrip) {
        // Drips occasionally wobble/slide slower
        p.vy = 8 + Math.sin(p.life * 4) * 4;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.strokeStyle = `rgba(174, 219, 240, ${p.opacity})`;
      ctx.lineWidth = p.size * Math.min(scaleX, scaleY);
      ctx.beginPath();
      
      if (p.isDrip) {
        // Draw vertical drip
        ctx.moveTo(p.x * scaleX, p.y * scaleY);
        ctx.lineTo(p.x * scaleX, (p.y - p.length) * scaleY);
      } else {
        // Draw slanted raindrop
        ctx.moveTo(p.x * scaleX, p.y * scaleY);
        ctx.lineTo((p.x - p.vx * 0.03) * scaleX, (p.y - p.vy * 0.03) * scaleY);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
