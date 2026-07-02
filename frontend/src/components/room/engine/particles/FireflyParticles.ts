// FireflyParticles — Glowing dots with bezier/sine paths (R5.5-P4)
// 8-12 particles with soft glow, random bezier/sine movement
// Active only during nighttime (20h-6h)

import { Particle } from './SteamParticles';

export class FireflyParticleSystem {
  particles: Particle[] = [];
  maxParticles = 12;

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
      this.particles[i].life = Math.random() * this.particles[i].maxLife;
    }
  }

  createParticle(): Particle {
    // Spawn around plants or general cozy spots
    const spawnOnLeft = Math.random() > 0.5;
    const x = spawnOnLeft
      ? 50 + Math.random() * 200
      : 1100 + Math.random() * 600;
    const y = spawnOnLeft
      ? 600 + Math.random() * 300
      : 50 + Math.random() * 300;

    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 12,
      opacity: 0,
      size: 1.5 + Math.random() * 2.5,
      life: 0,
      maxLife: 5 + Math.random() * 5,
    };
  }

  update(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles[i] = this.createParticle();
        continue;
      }

      // Add gentle sine/cosine drift to simulate random hover/flight path
      p.x += (p.vx + Math.sin(p.life * 1.5) * 12) * dt;
      p.y += (p.vy + Math.cos(p.life * 1.2) * 10) * dt;

      // Glow intensity: soft breathing glow
      const pulse = 0.4 + 0.6 * Math.sin(p.life * 3);
      
      // Fade in and out
      if (p.life < p.maxLife * 0.2) {
        p.opacity = (p.life / (p.maxLife * 0.2)) * 0.8 * pulse;
      } else if (p.life > p.maxLife * 0.8) {
        p.opacity = (1 - (p.life - p.maxLife * 0.8) / (p.maxLife * 0.2)) * 0.8 * pulse;
      } else {
        p.opacity = 0.8 * pulse;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number): void {
    ctx.save();
    for (const p of this.particles) {
      if (p.opacity <= 0) continue;
      
      const s = Math.min(scaleX, scaleY);
      
      // Draw firefly core
      ctx.beginPath();
      ctx.arc(p.x * scaleX, p.y * scaleY, p.size * s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 245, 60, ${p.opacity})`;
      ctx.fill();

      // Draw soft glow aura
      ctx.beginPath();
      ctx.arc(p.x * scaleX, p.y * scaleY, p.size * 3 * s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 245, 60, ${p.opacity * 0.25})`;
      ctx.fill();
    }
    ctx.restore();
  }
}
