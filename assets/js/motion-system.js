/**
 * MAGIZHVAGAM — Unified Motion System
 * 
 * Manages:
 * 1. Lenis Smooth Scroll Engine
 * 2. GSAP & ScrollTrigger integration
 * 3. Smart Sticky Header (auto-hide on scroll down, show on scroll up, dynamic blur & shadow)
 * 4. Ambient Background Layer (floating gradient blobs & mouse reactive glow)
 * 5. Custom Cursor & Magnetic Interactions (desktop only)
 * 6. Footer scroll-triggered reveal animations
 * 7. Page Transition Overlay & self-drawing SVGs
 * 
 * Respects prefers-reduced-motion at all times.
 */

(function () {
  'use strict';

  // Constants & Settings
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lenisInstance = null;

  // 1. Initializer
  function initMotionSystem() {
    if (prefersReducedMotion) {
      console.log('[MotionSystem] Reduced motion active, disabling animations');
      applyReducedMotionFallbacks();
      return;
    }

    // Load library requirements
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof Lenis === 'undefined') {
      console.warn('[MotionSystem] GSAP, ScrollTrigger, or Lenis missing. Skipping premium effects.');
      return;
    }

    initPageLoader(); // Run the morphing wave page loader experience first
    initSmoothScroll();
    initSmartHeader();
    initAmbientLayer();
    initAuroraMeshAndNoise();
    initCustomCursor();
    initMagneticInteractions();
    initTilt3DEffect();
    initSpotlightHighlight();
    initInteractiveStats();
    initRippleAndElasticEffects();
    initSectionAnimations();
    initFooterAnimations();
    initPageTransitions();
  }

  // Fallback mode for users who prefer reduced motion
  function applyReducedMotionFallbacks() {
    document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('revealed'));
    const header = document.getElementById('main-header');
    if (header) {
      window.addEventListener('scroll', () => {
        const y = window.scrollY || 0;
        header.classList.toggle('scrolled', y > 30);
      }, { passive: true });
    }
  }

  // 2. Smooth Scroll Engine
  function initSmoothScroll() {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    lenisInstance = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 1.5,
      infinite: false,
    });

    // Enforce immediate zero position on Lenis load
    lenisInstance.scrollTo(0, { immediate: true });

    // Sync ScrollTrigger updates with Lenis scroll
    lenisInstance.on('scroll', ScrollTrigger.update);

    // Sync GSAP ticker with Lenis raf
    gsap.ticker.add((time) => {
      lenisInstance.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);
    window.lenis = lenisInstance;

    // Clear ScrollTrigger's internal scroll restoration state
    if (typeof ScrollTrigger !== 'undefined') {
      ScrollTrigger.clearScrollMemory();
      ScrollTrigger.refresh(true);
    }
  }

  // 3. Smart Sticky Header Behavior
  function initSmartHeader() {
    const header = document.getElementById('main-header');
    if (!header) return;

    let lastScrollY = window.scrollY;

    lenisInstance.on('scroll', (e) => {
      const scrollY = window.scrollY || e.scroll || 0;

      // Blur and opacity increments with scroll depth
      header.classList.toggle('scrolled', scrollY > 30);
      header.classList.toggle('header-scrolled', scrollY > 80);
      header.classList.toggle('header-compact', scrollY > 200);

      // Auto Hide on Scroll Down, Reveal on Scroll Up
      if (scrollY > 150) {
        if (scrollY > lastScrollY) {
          header.classList.add('header-hidden');
        } else {
          header.classList.remove('header-hidden');
        }
      } else {
        header.classList.remove('header-hidden');
      }

      lastScrollY = scrollY;
    });
  }

  // 4. Ambient Background Layer
  function initAmbientLayer() {
    // Check if background overlay containers exist or inject them
    let ambientContainer = document.getElementById('mz-ambient-layer');
    if (!ambientContainer) {
      ambientContainer = document.createElement('div');
      ambientContainer.id = 'mz-ambient-layer';
      ambientContainer.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:-1; overflow:hidden;';
      document.body.prepend(ambientContainer);
    }

    // Create 2 animated floating gradient blobs
    const blob1 = document.createElement('div');
    blob1.className = 'ambient-gradient-blob';
    blob1.style.top = '15%';
    blob1.style.left = '10%';
    blob1.style.animationDelay = '0s';

    const blob2 = document.createElement('div');
    blob2.className = 'ambient-gradient-blob';
    blob2.style.bottom = '20%';
    blob2.style.right = '10%';
    blob2.style.animationDelay = '-5s';
    blob2.style.animationDuration = '25s';

    ambientContainer.appendChild(blob1);
    ambientContainer.appendChild(blob2);

    // Mouse reactive glow (Desktop only)
    if (window.matchMedia('(pointer: fine)').matches) {
      const glow = document.createElement('div');
      glow.style.cssText = 'position:fixed; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle, rgba(201, 145, 61, 0.04) 0%, rgba(201, 145, 61, 0) 70%); filter:blur(30px); pointer-events:none; z-index:-1; opacity:0; transition:opacity 0.6s ease; transform:translate(-50%, -50%);';
      ambientContainer.appendChild(glow);

      window.addEventListener('mousemove', (e) => {
        glow.style.opacity = '1';
        gsap.to(glow, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      }, { passive: true });

      document.addEventListener('mouseleave', () => {
        glow.style.opacity = '0';
      });
    }
  }

  // 5. Custom Cursor Experience (Desktop only)
  function initCustomCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    // Check if cursor already exists
    if (document.querySelector('.custom-cursor')) return;

    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    const dot = document.createElement('div');
    dot.className = 'custom-cursor-dot';

    document.body.appendChild(cursor);
    document.body.appendChild(dot);

    let cursorX = 0, cursorY = 0;
    let targetX = 0, targetY = 0;

    window.addEventListener('mousemove', (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      // Immediate position for center dot
      dot.style.left = targetX + 'px';
      dot.style.top = targetY + 'px';
    }, { passive: true });

    // Smooth lerp follow for the outer cursor ring
    function updateCursorPosition() {
      const lerpFactor = 0.15;
      cursorX += (targetX - cursorX) * lerpFactor;
      cursorY += (targetY - cursorY) * lerpFactor;

      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';

      requestAnimationFrame(updateCursorPosition);
    }
    requestAnimationFrame(updateCursorPosition);

    // Hover state extensions
    const hoverSelectors = 'a, button, input, select, textarea, .product-card, .category-card, .qty-btn, .header-icon-btn';
    
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.add('hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.remove('hovering');
      }
    });

    // Hide default cursor when active
    document.documentElement.style.cursor = 'none';
  }

  // 6. Magnetic Elements & Micro Interactive Hovers
  function initMagneticInteractions() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    // Locate elements marked as magnetic
    const magneticElements = document.querySelectorAll('.btn-interactive, .header-icon-link, .header-icon-btn, .footer-social-icon');
    
    magneticElements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const elX = rect.left + rect.width / 2;
        const elY = rect.top + rect.height / 2;
        const disX = e.clientX - elX;
        const disY = e.clientY - elY;

        // Draw element slightly towards the cursor (max 10px translate)
        gsap.to(el, {
          x: disX * 0.35,
          y: disY * 0.35,
          duration: 0.3,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto'
        });
      });
    });
  }

  // 7. Footer Scroll-Triggered Reveal Animations
  function initFooterAnimations() {
    const footer = document.getElementById('main-footer');
    if (!footer) return;

    // Wait until footer.js finishes dynamic injection
    const observer = new MutationObserver(() => {
      if (footer.classList.contains('footer-v4-loaded')) {
        observer.disconnect();
        setupFooterMotion();
      }
    });

    observer.observe(footer, { attributes: true, attributeFilter: ['class'] });

    function setupFooterMotion() {
      // Staggered reveal for footer sub-sections
      const sections = footer.querySelectorAll('.footer-brand, .footer-column, .footer-newsletter');
      if (!sections.length) return;

      gsap.fromTo(sections, 
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footer,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );
    }
  }

  // 8. Page Entrance & Exit Transitions (Morphing wave curtain)
  function initPageTransitions() {
    if (prefersReducedMotion) return;

    // Create curtain overlay element
    const overlay = document.createElement('div');
    overlay.className = 'transition-curtain-overlay active';
    overlay.innerHTML = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path class="transition-path" d="M 0 0 V 100 Q 50 100 100 100 V 0 Z" fill="var(--bg-main, #0D0A14)" />
      </svg>
    `;
    document.body.appendChild(overlay);

    const path = overlay.querySelector('.transition-path');

    // Page Entrance Transition (Wipe down/out)
    const entranceObj = { progress: 0 };
    gsap.to(entranceObj, {
      progress: 1,
      duration: 0.8,
      ease: 'power3.out',
      onUpdate: () => {
        const p = entranceObj.progress;
        // From y = 100 to y = 0 (top-down reveal)
        const y = p * 100;
        // Control point curves down, then flattens out
        let controlY;
        if (p < 0.5) {
          controlY = 100 + (p * 80);
        } else {
          controlY = 100 + ((1 - p) * 80);
        }
        path.setAttribute('d', `M 0 100 V ${y} Q 50 ${controlY} 100 ${y} V 100 Z`);
      },
      onComplete: () => {
        overlay.classList.remove('active');
        overlay.remove();
      }
    });

    // Intercept navigation links for exit transition using delegation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      
      // Filter out links
      if (
        href && 
        !href.startsWith('#') && 
        !href.startsWith('javascript:') && 
        !href.startsWith('mailto:') && 
        !href.startsWith('tel:') &&
        link.getAttribute('target') !== '_blank' &&
        !e.ctrlKey && !e.metaKey && !e.shiftKey
      ) {
        try {
          const url = new URL(link.href);
          if (url.origin === window.location.origin) {
            e.preventDefault();
            
            // Re-inject transition curtain overlay
            const exitOverlay = document.createElement('div');
            exitOverlay.className = 'transition-curtain-overlay active';
            exitOverlay.innerHTML = `
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <path class="transition-path" d="M 0 100 V 100 Q 50 100 100 100 V 100 Z" fill="var(--bg-main, #0D0A14)" />
              </svg>
            `;
            document.body.appendChild(exitOverlay);

            const exitPath = exitOverlay.querySelector('.transition-path');
            
            const exitObj = { progress: 0 };
            gsap.to(exitObj, {
              progress: 1,
              duration: 0.7,
              ease: 'power3.inOut',
              onUpdate: () => {
                const p = exitObj.progress;
                // Wipe up from bottom to top
                const y = 100 - (p * 100);
                let controlY;
                if (p < 0.5) {
                  controlY = 100 - (p * 140);
                } else {
                  controlY = (1 - p) * 60;
                }
                exitPath.setAttribute('d', `M 0 100 V ${y} Q 50 ${controlY} 100 ${y} V 100 Z`);
              },
              onComplete: () => {
                window.location.href = href;
              }
            });
          }
        } catch (err) {
          // Fallback if URL parsing fails
          window.location.href = href;
        }
      }
    });
  }

  // 9. Aurora and Noise Layers Injection
  function initAuroraMeshAndNoise() {
    if (document.getElementById('mz-aurora-container')) return;

    const aurora = document.createElement('div');
    aurora.id = 'mz-aurora-container';
    aurora.className = 'aurora-mesh-container';
    aurora.innerHTML = `
      <div class="aurora-mesh-blob aurora-blob-1"></div>
      <div class="aurora-mesh-blob aurora-blob-2"></div>
      <div class="aurora-mesh-blob aurora-blob-3"></div>
    `;

    const noise = document.createElement('div');
    noise.className = 'noise-texture-overlay';

    document.body.prepend(noise);
    document.body.prepend(aurora);

    // Liquid distortion SVG injection
    if (!document.getElementById('liquid-distortion-svg')) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'liquid-distortion-svg';
      svg.style.cssText = 'position:absolute; width:0; height:0; pointer-events:none; z-index:-10;';
      svg.innerHTML = `
        <defs>
          <filter id="liquid-distortion">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="12" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      `;
      document.body.appendChild(svg);
    }
  }

  // 10. 3D Tilt Effect for premium cards
  function initTilt3DEffect() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    // Use event delegation for dynamic product cards
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.product-card, .category-card, .tilt-3d-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const xc = rect.width / 2;
      const yc = rect.height / 2;

      const angleX = (yc - y) / 10; // Max 10 deg rotation on X axis
      const angleY = (x - xc) / 10; // Max 10 deg rotation on Y axis

      gsap.to(card, {
        rotateX: angleX,
        rotateY: angleY,
        scale: 1.025,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000,
        overwrite: 'auto'
      });
    });

    document.addEventListener('mouseout', (e) => {
      const card = e.target.closest('.product-card, .category-card, .tilt-3d-card');
      if (!card) return;

      // Check if mouse really left the card
      const related = e.relatedTarget;
      if (related && card.contains(related)) return;

      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.5,
        ease: 'elastic.out(1, 0.4)',
        overwrite: 'auto'
      });
    });
  }

  // 11. Spotlight Hover variable updater
  function initSpotlightHighlight() {
    document.addEventListener('mousemove', (e) => {
      const card = e.target.closest('.premium-glass-card, .product-card, .category-card, .glass-panel');
      if (!card) return;

      // Add overlay element if not present
      if (!card.querySelector('.spotlight-hover-layer')) {
        const layer = document.createElement('div');
        layer.className = 'spotlight-hover-layer';
        card.appendChild(layer);
      }

      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty('--mouse-x', `${x}%`);
      card.style.setProperty('--mouse-y', `${y}%`);
    });
  }

  // 12. Counter Animations for Stats
  function initInteractiveStats() {
    const stats = document.querySelectorAll('.stat-number');
    stats.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'), 10) || 0;
      if (target === 0) return;

      stat.classList.add('counter-animate-container');
      const obj = { value: 0 };

      gsap.to(obj, {
        value: target,
        duration: 2.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: stat,
          start: 'top 90%',
          toggleActions: 'play none none none'
        },
        onUpdate: () => {
          // Format with thousands separator
          stat.textContent = Math.floor(obj.value).toLocaleString('en-IN');
        }
      });
    });
  }

  // 13. Click Ripple & Elastic Scaling on elements
  function initRippleAndElasticEffects() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .btn-primary, .btn-secondary, .btn-interactive, .header-icon-btn');
      if (!btn) return;

      // Simple scaling push-back and bounce out
      gsap.fromTo(btn, { scale: 0.95 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.4)' });

      // Build CSS ripple element
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const diameter = Math.max(rect.width, rect.height);
      const radius = diameter / 2;

      ripple.style.width = ripple.style.height = `${diameter}px`;
      ripple.style.left = `${e.clientX - rect.left - radius}px`;
      ripple.style.top = `${e.clientY - rect.top - radius}px`;
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.transform = 'scale(0)';
      ripple.style.background = 'rgba(255, 255, 255, 0.35)';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '1';
      
      // Ensure button is relative for absolute positioning of ripple
      const origPos = window.getComputedStyle(btn).position;
      if (origPos !== 'absolute' && origPos !== 'fixed' && origPos !== 'relative') {
        btn.style.position = 'relative';
      }
      // Ensure overflow hidden
      const origOverflow = window.getComputedStyle(btn).overflow;
      if (origOverflow !== 'hidden') {
        btn.style.overflow = 'hidden';
      }

      btn.appendChild(ripple);

      gsap.to(ripple, {
        scale: 4,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          ripple.remove();
        }
      });
    });
  }

  // 14. Complex ScrollTrigger Section Animations
  function initSectionAnimations() {
    // A. Hero parallax
    const heroViewport = document.querySelector('.hero-parallax-viewport');
    if (heroViewport) {
      gsap.to('.hero-central-layout', {
        y: 100,
        opacity: 0.2,
        scrollTrigger: {
          trigger: heroViewport,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
      // Parallax bg-canvas
      gsap.to('.parallax-layer.bg-canvas', {
        yPercent: 20,
        scrollTrigger: {
          trigger: heroViewport,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    // B. Category Highlight Stagger reveal
    const catSection = document.getElementById('categories');
    if (catSection) {
      // Set up a MutationObserver to listen when dynamic categories are mounted
      const observer = new MutationObserver(() => {
        const cards = catSection.querySelectorAll('.category-card');
        if (cards.length > 0) {
          observer.disconnect();
          gsap.from(cards, {
            y: 50,
            opacity: 0,
            scale: 0.9,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: catSection,
              start: 'top 80%',
              toggleActions: 'play none none none'
            }
          });
        }
      });
      observer.observe(catSection, { childList: true, subtree: true });
    }

    // C. Pinned Collections Horizontal scroll
    const collectionsSection = document.querySelector('[data-mz-section="collections_spotlight"]');
    if (collectionsSection) {
      // In Phase 1 we can build a pinned showcase if columns exist
      // If collection-card wrapper exists
      const wrapper = collectionsSection.querySelector('.collections-horizontal-wrapper');
      if (wrapper) {
        gsap.to(wrapper, {
          x: () => -(wrapper.scrollWidth - window.innerWidth),
          ease: 'none',
          scrollTrigger: {
            trigger: collectionsSection,
            pin: true,
            scrub: 1,
            start: 'top top',
            end: () => `+=${wrapper.scrollWidth - window.innerWidth}`
          }
        });
      }
    }

    // D. Products sections (stagger tilt reveal)
    const productSections = ['#featured-products-mount', '#bestseller-products-grid', '#newarrival-products-grid'];
    productSections.forEach(selector => {
      const grid = document.querySelector(selector);
      if (grid) {
        const observer = new MutationObserver(() => {
          const cards = grid.querySelectorAll('.product-card, .pc-card');
          if (cards.length > 0) {
            observer.disconnect();
            gsap.from(cards, {
              y: 60,
              rotation: 2,
              scale: 0.95,
              opacity: 0,
              duration: 1,
              stagger: 0.1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: grid,
                start: 'top 85%'
              }
            });
          }
        });
        observer.observe(grid, { childList: true, subtree: true });
      }
    });

    // E. Brand Story Timeline Animation
    const timeline = document.querySelector('.brand-story-timeline');
    if (timeline) {
      const timelineContainer = timeline.querySelector('.timeline-container');
      const items = timeline.querySelectorAll('.timeline-item');
      
      // Draw progress line trigger
      if (timelineContainer) {
        gsap.fromTo(timelineContainer, 
          { borderLeftColor: 'rgba(106, 13, 173, 0.1)' },
          {
            borderLeftColor: 'rgba(106, 13, 173, 1)',
            duration: 2,
            scrollTrigger: {
              trigger: timelineContainer,
              start: 'top 70%',
              end: 'bottom 40%',
              scrub: true
            }
          }
        );
      }

      items.forEach((item, index) => {
        const dot = item.querySelector('.timeline-dot');
        const content = item.querySelectorAll('h3, p');

        gsap.from(dot, {
          scale: 0,
          backgroundColor: '#C9913D',
          duration: 0.6,
          scrollTrigger: {
            trigger: item,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        });

        gsap.from(content, {
          x: -30,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        });
      });
    }

    // F. FAQ Smooth Accordion
    const faqs = document.querySelectorAll('.faq-item');
    faqs.forEach(faq => {
      const trigger = faq.querySelector('.faq-trigger');
      const content = faq.querySelector('.faq-content');
      const icon = faq.querySelector('.faq-icon');
      if (!trigger || !content) return;

      // Reset content style for GSAP heights
      content.style.display = 'block';
      content.style.height = '0px';
      content.style.overflow = 'hidden';
      content.style.opacity = '0';

      let isOpen = false;

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        isOpen = !isOpen;

        // Close other FAQs
        if (isOpen) {
          faqs.forEach(other => {
            if (other === faq) return;
            const otherTrig = other.querySelector('.faq-trigger');
            const otherCont = other.querySelector('.faq-content');
            const otherIcon = other.querySelector('.faq-icon');
            if (otherCont && otherCont.style.height !== '0px') {
              gsap.to(otherCont, { height: 0, opacity: 0, paddingBottom: 0, duration: 0.35, ease: 'power2.out' });
              if (otherIcon) gsap.to(otherIcon, { rotation: 0, duration: 0.3 });
            }
          });
        }

        gsap.to(content, {
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
          duration: 0.45,
          ease: 'power3.inOut',
          onStart: () => {
            if (isOpen) {
              content.style.paddingBottom = '16px';
            }
          },
          onComplete: () => {
            if (!isOpen) {
              content.style.paddingBottom = '0px';
            }
          }
        });

        if (icon) {
          gsap.to(icon, {
            rotation: isOpen ? 45 : 0,
            duration: 0.3,
            ease: 'power2.out'
          });
        }
      });
    });
  }

  // 15. Page Loader with morphing wave & glowing progress gradient
  function initPageLoader() {
    if (document.getElementById('mz-page-loader')) return;

    const loader = document.createElement('div');
    loader.id = 'mz-page-loader';
    loader.style.cssText = `
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: var(--bg-main, #0D0A14);
      z-index: 9999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.4s ease;
    `;
    loader.innerHTML = `
      <div style="width: 240px; height: 3px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; position: relative;">
        <div id="loader-progress-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: linear-gradient(90deg, #A855F7, #C9913D); box-shadow: 0 0 10px rgba(168,85,247,0.8); transition: width 0.08s ease;"></div>
      </div>
      <div style="font-family:'Outfit', sans-serif; font-size:11px; color:var(--palette-text-muted, #B8B0C8); margin-top:16px; font-weight:700; text-transform:uppercase; letter-spacing:3px; opacity: 0.85;">Loading Experience</div>
      <div style="position: absolute; bottom: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: -1;">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width: 100%; height: 100%;">
          <path id="loader-wave-path" d="M 0 100 V 100 Q 50 100 100 100 V 100 Z" fill="var(--bg-main, #0D0A14)" />
        </svg>
      </div>
    `;

    document.body.appendChild(loader);

    const progressBar = document.getElementById('loader-progress-bar');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(dismissLoader, 150);
      }
      if (progressBar) progressBar.style.width = `${progress}%`;
    }, 60);

    function dismissLoader() {
      const path = document.getElementById('loader-wave-path');
      const obj = { progress: 0 };
      
      const tl = gsap.timeline({
        onComplete: () => {
          loader.remove();
        }
      });

      tl.to(obj, {
        progress: 1,
        duration: 0.85,
        ease: 'power3.inOut',
        onUpdate: () => {
          const p = obj.progress;
          // Wipe up the curtain from bottom to top
          const y = (1 - p) * 100;
          let controlY;
          if (p < 0.5) {
            controlY = 100 - (p * 140);
          } else {
            controlY = (1 - p) * 60;
          }
          if (path) path.setAttribute('d', `M 0 100 V ${y} Q 50 ${controlY} 100 ${y} V 100 Z`);
        }
      });

      tl.to(loader, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.35');
    }
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMotionSystem);
  } else {
    initMotionSystem();
  }

  window.MZMotionSystem = {
    initMotionSystem,
    getLenis: () => lenisInstance
  };
})();
