import { Particle } from './SteamParticles';

// DustParticles — Sunlight dust motes (R5.5-P4)
// 10-15 tiny particles floating slowly in window light beam
// Active only during daytime

export class DustParticleSystem {
  particles: Particle[] = [];
  maxParticles = 15;

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
      this.particles[i].life = Math.random() * this.particles[i].maxLife;
    }
  }

  createParticle(): Particle {
    // Spawn within window light beam area
    return {
      x: 700 + Math.random() * 600,
      y: 200 + Math.random() * 500,
      vx: (Math.random() - 0.5) * 5,
      vy: 10 + Math.random() * 15,
      opacity: 0,
      size: 1 + Math.random() * 2,
      life: 0,
      maxLife: 4 + Math.random() * 4,
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
      
      // Gentle drift
      p.x += (p.vx + Math.sin(p.life * 2) * 10) * dt;
      p.y += p.vy * dt;
      
      // Fade in and out softly
      if (p.life < p.maxLife * 0.3) {
        p.opacity = (p.life / (p.maxLife * 0.3)) * 0.5;
      } else if (p.life > p.maxLife * 0.7) {
        p.opacity = (1 - (p.life - p.maxLife * 0.7) / (p.maxLife * 0.3)) * 0.5;
      } else {
        p.opacity = 0.5;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, scaleX: number, scaleY: number): void {
    ctx.save();
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x * scaleX, p.y * scaleY, p.size * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 245, 200, ${p.opacity})`;
      ctx.fill();
    }
    ctx.restore();
  }
}
