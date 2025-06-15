import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const ScrollTriggeredSection = ({ 
  children, 
  className = '',
  animation = 'fadeInUp',
  stagger = 0.2,
  trigger = 'top 80%',
  pin = false,
  scrub = false,
  ...props 
}) => {
  const sectionRef = useRef();
  const elementsRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const elements = elementsRef.current?.children || [elementsRef.current];
      if (!elements || elements.length === 0) return;

      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        gsap.set(elements, { opacity: 1, y: 0, scale: 1 });
        return;
      }

      // Animation configurations
      const animations = {
        fadeInUp: {
          from: { opacity: 0, y: 50 },
          to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        },
        fadeInDown: {
          from: { opacity: 0, y: -50 },
          to: { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        },
        fadeInLeft: {
          from: { opacity: 0, x: -50 },
          to: { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
        },
        fadeInRight: {
          from: { opacity: 0, x: 50 },
          to: { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" }
        },
        scaleIn: {
          from: { opacity: 0, scale: 0.8 },
          to: { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
        },
        popIn: {
          from: { opacity: 0, scale: 0.5, rotation: -10 },
          to: { opacity: 1, scale: 1, rotation: 0, duration: 1, ease: "elastic.out(1, 0.5)" }
        },
        slideInRotate: {
          from: { opacity: 0, y: 100, rotation: 10 },
          to: { opacity: 1, y: 0, rotation: 0, duration: 1, ease: "power3.out" }
        },
        slideInFromSides: {
          from: { opacity: 0, x: 0, y: 50 },
          to: { opacity: 1, x: 0, y: 0, duration: 1, ease: "power3.out" }
        }
      };

      const config = animations[animation] || animations.fadeInUp;

      // Special handling for slideInFromSides animation
      if (animation === 'slideInFromSides') {
        Array.from(elements).forEach((element, index) => {
          const isLeft = element.classList.contains('scroll-trigger-left');
          const isRight = element.classList.contains('scroll-trigger-right');

          if (isLeft) {
            gsap.set(element, { opacity: 0, x: -100, y: 30 });
          } else if (isRight) {
            gsap.set(element, { opacity: 0, x: 100, y: 30 });
          } else {
            gsap.set(element, config.from);
          }
        });
      } else {
        // Set initial state for other animations
        gsap.set(elements, config.from);
      }

      // Create ScrollTrigger
      const scrollTriggerConfig = {
        trigger: sectionRef.current,
        start: trigger,
        end: pin ? "bottom top" : undefined,
        pin: pin,
        scrub: scrub,
        onEnter: () => {
          if (animation === 'slideInFromSides') {
            Array.from(elements).forEach((element, index) => {
              const isLeft = element.classList.contains('scroll-trigger-left');
              const isRight = element.classList.contains('scroll-trigger-right');

              gsap.to(element, {
                opacity: 1,
                x: 0,
                y: 0,
                duration: 1.2,
                ease: "power3.out",
                delay: index * stagger
              });
            });
          } else {
            gsap.to(elements, {
              ...config.to,
              stagger: stagger
            });
          }
        },
        onLeave: () => {
          if (scrub) {
            gsap.to(elements, {
              ...config.from,
              duration: 0.3,
              stagger: stagger / 2
            });
          }
        },
        onEnterBack: () => {
          gsap.to(elements, {
            ...config.to,
            duration: 0.5,
            stagger: stagger / 2
          });
        }
      };

      ScrollTrigger.create(scrollTriggerConfig);

    }, sectionRef);

    return () => ctx.revert();
  }, [animation, stagger, trigger, pin, scrub]);

  return (
    <section ref={sectionRef} className={className} {...props}>
      <div ref={elementsRef}>
        {children}
      </div>
    </section>
  );
};

// Specialized components for common use cases
export const AnimatedCards = ({ cards, className = '', cardClassName = '' }) => {
  const cardsRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cardElements = cardsRef.current?.children;
      if (!cardElements) return;

      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        gsap.set(cardElements, { opacity: 1 });
        return;
      }

      gsap.set(cardElements, { 
        opacity: 0, 
        y: 60, 
        scale: 0.9,
        rotationY: 15
      });

      ScrollTrigger.create({
        trigger: cardsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to(cardElements, {
            opacity: 1,
            y: 0,
            scale: 1,
            rotationY: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: {
              amount: 0.6,
              from: "start"
            }
          });
        }
      });

      // Add hover effects
      Array.from(cardElements).forEach(card => {
        const hoverTl = gsap.timeline({ paused: true });
        
        hoverTl.to(card, {
          y: -10,
          scale: 1.02,
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          duration: 0.3,
          ease: "power2.out"
        });

        card.addEventListener('mouseenter', () => hoverTl.play());
        card.addEventListener('mouseleave', () => hoverTl.reverse());
      });

    }, cardsRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={cardsRef} className={className}>
      {cards.map((card, index) => (
        <div key={index} className={`card-hover ${cardClassName}`}>
          {card}
        </div>
      ))}
    </div>
  );
};

// Counter animation component
export const AnimatedCounter = ({ 
  target, 
  duration = 2, 
  suffix = '', 
  prefix = '',
  className = '',
  trigger = "top 80%"
}) => {
  const counterRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const element = counterRef.current;
      if (!element) return;

      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        element.textContent = `${prefix}${target.toLocaleString()}${suffix}`;
        return;
      }

      const obj = { value: 0 };
      element.textContent = `${prefix}0${suffix}`;

      ScrollTrigger.create({
        trigger: element,
        start: trigger,
        onEnter: () => {
          gsap.to(obj, {
            value: target,
            duration: duration,
            ease: "power2.out",
            onUpdate: () => {
              if (element && element.textContent !== undefined) {
                element.textContent = `${prefix}${Math.ceil(obj.value).toLocaleString()}${suffix}`;
              }
            }
          });
        }
      });

    }, counterRef);

    return () => ctx.revert();
  }, [target, duration, suffix, prefix, trigger]);

  return (
    <span ref={counterRef} className={className} data-counter data-target={target}>
      {prefix}0{suffix}
    </span>
  );
};

// Text reveal animation
export const AnimatedText = ({ 
  text, 
  className = '',
  animation = 'slideUp',
  stagger = 0.05,
  trigger = "top 80%"
}) => {
  const textRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const element = textRef.current;
      if (!element) return;

      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) {
        element.style.opacity = '1';
        return;
      }

      // Split text into spans
      const words = text.split(' ');
      element.innerHTML = words.map(word => 
        `<span class="inline-block">${word}</span>`
      ).join(' ');

      const wordElements = element.children;

      const animations = {
        slideUp: {
          from: { opacity: 0, y: 50 },
          to: { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1, duration: 0.8, ease: "power2.out" }
        },
        typewriter: {
          from: { opacity: 0, width: 0 },
          to: { opacity: 1, width: "auto", duration: 0.1, ease: "none" }
        }
      };

      const config = animations[animation] || animations.slideUp;

      gsap.set(wordElements, config.from);

      ScrollTrigger.create({
        trigger: element,
        start: trigger,
        onEnter: () => {
          gsap.to(wordElements, {
            ...config.to,
            stagger: stagger
          });
        }
      });

    }, textRef);

    return () => ctx.revert();
  }, [text, animation, stagger, trigger]);

  return (
    <div ref={textRef} className={className}>
      {text}
    </div>
  );
};

// Parallax section
export const ParallaxSection = ({ 
  children, 
  speed = 0.5, 
  className = '',
  direction = 'up'
}) => {
  const sectionRef = useRef();

  useEffect(() => {
    const ctx = gsap.context(() => {
      const element = sectionRef.current;
      if (!element) return;

      // Check for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (prefersReducedMotion) return;

      const multiplier = direction === 'up' ? -1 : 1;

      ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const yPos = progress * 100 * speed * multiplier;
          gsap.set(element, { y: yPos });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, [speed, direction]);

  return (
    <div ref={sectionRef} className={className}>
      {children}
    </div>
  );
};

export default ScrollTriggeredSection;
