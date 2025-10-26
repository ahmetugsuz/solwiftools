import { useEffect } from 'react';
import gsap from 'gsap';

const ScrollAnimation = () => {
  useEffect(() => {
    gsap.fromTo('.scrollElement', {
      opacity: 0,
      y: 100,
    }, {
      opacity: 1,
      y: 0,
      duration: 1,
      scrollTrigger: {
        trigger: '.scrollElement',
        start: 'top 80%',
      },
    });
  }, []);

  return (
    <div className="scrollElement">
      Scroll to animate me!
    </div>
  );
};

export default ScrollAnimation;
