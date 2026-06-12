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
    const cartBtn = document.getElementById('header-cart-btn');
    const drawer = document.getElementById('mini-cart-drawer');
    if (!cartBtn || !drawer) return;

    cartBtn.addEventListener('click', (e) => {
      e.preventDefault();
      drawer.classList.toggle('open');
      document.body.classList.toggle('drawer-open', drawer.classList.contains('open'));
    });

    drawer.querySelector('.mini-cart-close')?.addEventListener('click', () => {
      drawer.classList.remove('open');
      document.body.classList.remove('drawer-open');
    });
  }

  function initPage() {
    initHeaderScroll();
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
