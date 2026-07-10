/**
 * MAGIZHVAGAM — Storefront Initialization
 * Scroll reveal, header shrink, premium micro-interactions.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initHeaderScroll() {
    const header = document.getElementById('main-header');
    if (!header) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY || 0;
        header.classList.toggle('scrolled', y > 30);
        header.classList.toggle('header-scrolled', y > 80);
        header.classList.toggle('header-compact', y > 200);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initScrollReveal() {
    if (prefersReducedMotion) {
      document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('[data-reveal], .glass-panel, .product-card, .feature-card-item, .category-card').forEach((el, i) => {
      el.classList.add('scroll-reveal');
      el.style.setProperty('--reveal-delay', `${Math.min(i * 60, 400)}ms`);
      observer.observe(el);
    });
  }

  function initProductCardHover() {
    document.querySelectorAll('.product-card, .pc-card').forEach(card => {
      card.addEventListener('mouseenter', () => card.classList.add('is-hovered'));
      card.addEventListener('mouseleave', () => card.classList.remove('is-hovered'));
    });
  }

  function initMiniCartDrawer() {
    const cartBtn = document.getElementById('header-cart-btn') || document.getElementById('header-cart-link');
    const drawer = document.getElementById('mini-cart-drawer');
    if (!cartBtn || !drawer) return;

    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = drawer.classList.contains('open');
      if (!isOpen) {
        drawer.classList.add('open');
        document.body.classList.add('drawer-open');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(drawer, { x: '100%' }, { x: '0%', duration: 0.4, ease: 'power3.out' });
        }
      } else {
        closeDrawer();
      }
    });

    function closeDrawer() {
      if (typeof gsap !== 'undefined') {
        gsap.to(drawer, {
          x: '100%',
          duration: 0.35,
          ease: 'power3.in',
          onComplete: () => {
            drawer.classList.remove('open');
            document.body.classList.remove('drawer-open');
          }
        });
      } else {
        drawer.classList.remove('open');
        document.body.classList.remove('drawer-open');
      }
    }

    drawer.querySelector('.mini-cart-close')?.addEventListener('click', () => {
      closeDrawer();
    });
  }

  function initPage() {
    initScrollReveal();
    initProductCardHover();
    initMiniCartDrawer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
  } else {
    initPage();
  }

  window.MZStorefront = { initPage };
})();
