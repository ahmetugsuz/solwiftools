import React, { useEffect, useRef } from 'react';

const StarBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const stars = [];
    const numStars = 100;
    const starColor = '#4B3FE8';
    
    const createStar = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.6),
      size: Math.random() * 1 + 0.5,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2
    });

    for (let i = 0; i < numStars; i++) {
      stars.push(createStar());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach((star, index) => {
        star.x += star.speedX;
        star.y += star.speedY;
        
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        
        // Reset star if it goes too low or off screen
        if (star.y > canvas.height * 0.7 || star.y < 0) {
          stars[index] = createStar();
          stars[index].y = Math.random() * (canvas.height * 0.3);
        }
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = starColor;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
        backgroundColor: 'transparent'
      }}
    />
  );
};

export default StarBackground; 