import { useEffect } from 'react';
import gsap from 'gsap';

const AnimatedHeader = () => {
  useEffect(() => {
    gsap.fromTo('.header', {
      opacity: 0,
      y: -50,
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: 'power2.out',
    });
  }, []);

  return (
    <header className="header">
      <h1>Your Website</h1>
    </header>
  );
};

export default AnimatedHeader;
