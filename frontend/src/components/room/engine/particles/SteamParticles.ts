// SteamParticles — Coffee mug steam (R5.5-P4)
// 5-8 particles rising from mug, rotating gently, fading out, looping
// ALWAYS active (24/7)

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  size: number;
  life: number;
  maxLife: number;
}

export class SteamParticleSystem {
  particles: Particle[] = [];
  maxParticles = 8;
  
  // Base position relative to 1920x1080 canvas
  baseX = 1160; 
  baseY = 530; 

  constructor() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle());
      // Randomize initial life so they don't all spawn at once
      this.particles[i].life = Math.random() * this.particles[i].maxLife;
    }
  }

  createParticle(): Particle {
    return {
      x: this.baseX + (Math.random() - 0.5) * 20,
      y: this.baseY,
      vx: (Math.random() - 0.5) * 10,
      vy: -15 - Math.random() * 20,
      opacity: 0,
      size: 15 + Math.random() * 15,
      life: 0,
      maxLife: 2 + Math.random() * 2,
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
      
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Fade in and out
      if (p.life < p.maxLife * 0.2) {
        p.opacity = (p.life / (p.maxLife * 0.2)) * 0.4;
      } else if (p.life > p.maxLife * 0.5) {
        p.opacity = (1 - (p.life - p.maxLife * 0.5) / (p.maxLife * 0.5)) * 0.4;
      } else {
        p.opacity = 0.4;
      }
      
      p.size += dt * 5;
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
