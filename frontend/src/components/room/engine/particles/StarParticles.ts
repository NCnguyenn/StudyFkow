// StarParticles — Twinkling stars outside window (R5.5-P4)
// 20-35 points with random opacity twinkling
// Active only during nighttime (20h-6h)

import { Particle } from './SteamParticles';

export class StarParticleSystem {
  particles: Particle[] = [];
  maxParticles = 35;

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
      // Randomize initial life/opacity so twinkling is out-of-sync
      this.particles[i].life = Math.random() * this.particles[i].maxLife;
    }
  }

  createParticle(): Particle {
    return {
      x: 730 + Math.random() * 400,
      y: 70 + Math.random() * 230,
      vx: 0,
      vy: 0,
      opacity: Math.random() * 0.8,
      size: 0.8 + Math.random() * 1.4,
      life: 0,
      maxLife: 2 + Math.random() * 3,
    };
  }

  update(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        p.life = 0;
        p.maxLife = 2 + Math.random() * 3;
      }
      // Twinkle: cosine/sine wave oscillation of opacity
      p.opacity = 0.2 + 0.6 * Math.abs(Math.sin((p.life / p.maxLife) * Math.PI));
    }
  }

  render(ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x * scaleX, p.y * scaleY, p.size * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
      ctx.fill();
    }
    ctx.restore();
  }
}
