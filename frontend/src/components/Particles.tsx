import React, { useEffect, useRef, memo } from 'react';
import './Particles.css';

interface ParticlesProps {
  particleColors?: string[];
  particleCount?: number;
  speed?: number;
  particleBaseSize?: number;
  moveParticlesOnHover?: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const DEFAULT_COLORS = ['#22c55e', '#16a34a', '#4ade80', '#e2e8f0'];

export const ParticlesComponent: React.FC<ParticlesProps> = ({
  particleColors = DEFAULT_COLORS,
  particleCount = 75,
  speed = 0.3,
  particleBaseSize = 2.0,
  moveParticlesOnHover = true,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep colors stable
  const colorsKey = particleColors.join(',');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const mouse = { x: -1000, y: -1000, radius: 120 };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!moveParticlesOnHover) return;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const colors = colorsKey.split(',');

    // Initialize particles with fixed, stable drift speeds
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.4 + 0.2) * speed;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        size: Math.random() * particleBaseSize + 1.0,
        color: colors[Math.floor(Math.random() * colors.length)] || '#22c55e',
        alpha: Math.random() * 0.6 + 0.3,
      });
    }

    let lastTime = performance.now();

    // Constant rate animation loop (capped delta time)
    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 16.667, 2.0); // normalize to 60fps base, max clamp 2x
      lastTime = currentTime;

      ctx.clearRect(0, 0, width, height);

      // Draw and update particles at steady physics rate
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Wrap around smoothly
        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;

        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Mouse interaction (gentle repulsion)
        if (moveParticlesOnHover && mouse.x > 0 && mouse.y > 0) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distance = Math.hypot(dx, dy);
          if (distance < mouse.radius && distance > 0) {
            const force = (mouse.radius - distance) / mouse.radius;
            p.x -= (dx / distance) * force * 1.5 * dt;
            p.y -= (dy / distance) * force * 1.5 * dt;
          }
        }

        // Draw particle dot with glow
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();

        // Draw connecting lines between nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 110) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = (1 - dist / 110) * 0.18;
            ctx.lineWidth = 0.6;
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [colorsKey, particleCount, speed, particleBaseSize, moveParticlesOnHover]);

  return (
    <div className={`particles-container ${className}`}>
      <canvas ref={canvasRef} className="particles-canvas" />
    </div>
  );
};

export const Particles = memo(ParticlesComponent);
export default Particles;
