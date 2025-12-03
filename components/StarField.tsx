import React, { useEffect, useRef } from 'react';

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas static stars logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const stars: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    const numStars = 200;

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1,
        opacity: Math.random()
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#FFF';

      stars.forEach(star => {
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        star.y += star.speed;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // DOM Shooting Stars Logic - RANDOMIZED
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createShootingStar = () => {
      const star = document.createElement('div');
      
      // Randomize properties
      const startX = Math.random() * window.innerWidth;
      const startY = Math.random() * window.innerHeight;
      
      // Random Angle between 0 and 360
      const angle = Math.random() * 360;
      
      // Length
      const length = 100 + Math.random() * 100;
      
      // CSS Injection for dynamic values not handled by tailwind class
      star.style.position = 'absolute';
      star.style.left = `${startX}px`;
      star.style.top = `${startY}px`;
      star.style.height = '1px';
      star.style.background = 'linear-gradient(90deg, white, transparent)';
      star.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.4)';
      star.style.width = '0px';
      star.style.transformOrigin = 'left center';
      star.style.transform = `rotate(${angle}deg)`;
      star.style.borderRadius = '999px';
      star.style.zIndex = '0';
      
      // Add animation manually via Web Animation API or class
      // Using Web Animation API for dynamic destination based on angle
      container.appendChild(star);

      const rad = angle * (Math.PI / 180);
      const distance = 500; // travel distance
      const endX = Math.cos(rad) * distance;
      const endY = Math.sin(rad) * distance;

      const animation = star.animate([
          { width: '0px', transform: `translate(0, 0) rotate(${angle}deg)`, opacity: 0 },
          { width: `${length}px`, opacity: 1, offset: 0.1 },
          { width: '0px', transform: `translate(${endX}px, ${endY}px) rotate(${angle}deg)`, opacity: 0 }
      ], {
          duration: 1000 + Math.random() * 1000,
          easing: 'linear',
          fill: 'forwards'
      });

      animation.onfinish = () => {
         if (container.contains(star)) {
             container.removeChild(star);
         }
      };
    };

    const interval = setInterval(() => {
        // Random chance to spawn
        if (Math.random() > 0.6) {
            createShootingStar();
        }
    }, 1000); // Slightly more frequent

    return () => clearInterval(interval);
  }, []);

  return (
    <>
        <canvas 
            ref={canvasRef} 
            className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
        />
        <div ref={containerRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden" />
    </>
  );
};

export default StarField;