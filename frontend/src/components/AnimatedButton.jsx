import { useEffect } from 'react';
import gsap from 'gsap';

const AnimatedButton = () => {
  useEffect(() => {
    gsap.fromTo('.connectButton', {
      opacity: 0,
      y: 50,
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      delay: 0.5,
      ease: 'power2.out',
    });
  }, []);

  return (
    <button className="connectButton bg-red-500 text-white p-4 rounded-lg">
      Connect Wallet
    </button>
  );
};

export default AnimatedButton;
