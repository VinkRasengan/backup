import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Đăng ký ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Reveal animation cho cards
export const initRevealCards = () => {
  gsap.utils.toArray('.reveal-card').forEach(card => {
    gsap.from(card, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: card,
        start: 'top 80%',
      }
    });
  });
};

// Hover lift effect cho cards - chỉ animate transform và shadow
export const initHoverLift = () => {
  gsap.utils.toArray('.hover-lift').forEach(el => {
    const tl = gsap.timeline({ paused: true });
    
    // Chỉ animate transform và shadow
    tl.to(el, { 
      y: -4, 
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', 
      duration: 0.3,
      ease: 'power2.out'
    });

    el.addEventListener('mouseenter', () => tl.play());
    el.addEventListener('mouseleave', () => tl.reverse());
  });
};

// Particle background animation
export const initParticleBackground = () => {
  gsap.utils.toArray('.bg-particle').forEach(particle => {
    gsap.to(particle, {
      x: '+=50',
      yoyo: true,
      repeat: -1,
      duration: 10,
      ease: 'sine.inOut'
    });
  });
};

// Sidebar animation
export const initSidebarAnimation = () => {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const tl = gsap.timeline({ paused: true });
  tl.to(sidebar, {
    x: 0,
    duration: 0.3,
    ease: 'power2.out'
  });

  // Toggle sidebar
  const toggleSidebar = () => {
    if (sidebar.classList.contains('sidebar-collapsed')) {
      tl.play();
    } else {
      tl.reverse();
    }
  };

  // Mobile sidebar
  const mobileToggle = document.querySelector('.mobile-sidebar-toggle');
  if (mobileToggle) {
    mobileToggle.addEventListener('click', toggleSidebar);
  }
};

// Initialize all animations
export const initAnimations = () => {
  initRevealCards();
  initHoverLift();
  initParticleBackground();
  initSidebarAnimation();
}; 