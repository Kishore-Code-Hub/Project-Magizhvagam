/**
 * MAGIZHVAGAM V4 — Dynamic Footer Renderer
 * 
 * Renders footer from footer_config API.
 * All styling via --ft-* CSS variables.
 */

(function() {
  'use strict';

  // Social icon SVGs (inline to avoid external dependencies)
  const SOCIAL_ICONS = {
    instagram: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
    facebook: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>',
    twitter: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>',
    youtube: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>',
    whatsapp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    linkedin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>'
  };

  async function fetchFooterConfig() {
    try {
      const res = await fetch('/api/site-settings/footer');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
    } catch (err) {
      console.warn('[footer.js] Could not load footer config');
    }
    return null;
  }

  function renderFooter(config) {
    if (!config) return '';

    const brand = config.brand || {};
    const columns = config.columns || [];
    const social = (config.social || []).filter(s => s.visible);
    const contact = config.contact || {};
    const newsletter = config.newsletter || {};
    const copyright = config.copyright || {};
    const badges = config.paymentBadges || {};

    // Brand section
    const brandHtml = `
      <div class="footer-brand">
        <h3 class="footer-logo">${brand.logoText || 'MAGIZHVAGAM'}</h3>
        <p class="footer-tagline">${brand.tagline || ''}</p>
        ${brand.originStatement ? `<p class="footer-origin">${brand.originStatement}</p>` : ''}
        ${social.length > 0 ? `
          <div class="footer-social">
            ${social.map(s => `
              <a href="${s.url}" class="footer-social-icon" target="_blank" rel="noopener noreferrer" aria-label="${s.platform}" title="${s.platform}">
                ${SOCIAL_ICONS[s.platform] || s.platform}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Columns
    const columnsHtml = columns.map(col => `
      <div class="footer-column">
        <h4 class="footer-column-heading">${col.heading}</h4>
        <ul class="footer-column-links">
          ${(col.links || []).map(link => `
            <li><a href="${link.url}" class="footer-link">${link.label}</a></li>
          `).join('')}
        </ul>
      </div>
    `).join('');

    // Contact
    let contactHtml = '';
    const contactItems = [];
    if (contact.phone && contact.phone.visible && contact.phone.value) {
      contactItems.push(`<p class="footer-contact-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> ${contact.phone.value}</p>`);
    }
    if (contact.email && contact.email.visible && contact.email.value) {
      contactItems.push(`<p class="footer-contact-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> ${contact.email.value}</p>`);
    }
    if (contact.address && contact.address.visible && contact.address.value) {
      contactItems.push(`<p class="footer-contact-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${contact.address.value}</p>`);
    }
    if (contactItems.length > 0) {
      contactHtml = `<div class="footer-column footer-contact"><h4 class="footer-column-heading">Contact</h4>${contactItems.join('')}</div>`;
    }

    // Newsletter -> WhatsApp Lead Capture
    let newsletterHtml = '';
    if (newsletter.heading) {
      newsletterHtml = `
        <div class="footer-newsletter">
          <div class="footer-newsletter-info">
            <h4 class="footer-newsletter-heading" style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #25D366; display: inline-flex; align-items: center;">${SOCIAL_ICONS.whatsapp}</span>
              ${newsletter.heading}
            </h4>
            ${newsletter.incentive ? `<p class="footer-newsletter-incentive">${newsletter.incentive}</p>` : ''}
          </div>
          <form class="footer-newsletter-form" style="display: flex; flex-direction: column; gap: 10px; flex-grow: 1; max-width: 480px;">
            <div style="display: flex; gap: 10px; width: 100%; flex-wrap: wrap;">
              <input type="text" class="footer-newsletter-name" placeholder="Enter your Name (Optional)" style="flex-grow: 1; padding: 12px 18px; border-radius: 8px; background: var(--ft-newsletter-input-bg, #1A1523); border: 1px solid var(--ft-newsletter-input-border, #3A2E4A); color: var(--text-color); font-size: 14px;">
              <input type="email" class="footer-newsletter-input" placeholder="${newsletter.placeholder || 'Enter your Email'}" required style="flex-grow: 1; padding: 12px 18px; border-radius: 8px; background: var(--ft-newsletter-input-bg, #1A1523); border: 1px solid var(--ft-newsletter-input-border, #3A2E4A); color: var(--text-color); font-size: 14px;">
              <button type="submit" class="footer-newsletter-btn" style="background: #25D366; color: #FFFFFF; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; flex-shrink: 0; cursor: pointer; transition: all 0.25s ease;">
                <span style="display: inline-flex; align-items: center; fill: currentColor; stroke: currentColor;">${SOCIAL_ICONS.whatsapp}</span>
                ${newsletter.ctaLabel || 'Join WhatsApp Community'}
              </button>
            </div>
            <div class="footer-newsletter-error" style="color: #ff4d4d; font-size: 12px; display: none; text-align: left; width: 100%; font-weight: 500;"></div>
          </form>
        </div>
      `;
    }

    // Payment badges
    let badgesHtml = '';
    if (badges.visible && badges.methods && badges.methods.length) {
      badgesHtml = `
        <div class="footer-payment-badges">
          ${badges.methods.map(m => `<span class="payment-badge">${m}</span>`).join('')}
        </div>
      `;
    }

    // Copyright
    let copyrightText = copyright.text || '';
    if (copyright.autoYear) {
      copyrightText = copyrightText.replace('{YEAR}', new Date().getFullYear());
    }

    return `
      <div class="footer-inner">
        <div class="footer-top">
          ${brandHtml}
          <div class="footer-columns">${columnsHtml}${contactHtml}</div>
        </div>
        ${newsletterHtml}
        <div class="footer-divider"></div>
        <div class="footer-bottom">
          <p class="footer-copyright">${copyrightText}</p>
          ${badgesHtml}
        </div>
      </div>
    `;
  }

  function attachNewsletterListener(footerEl, config) {
    const form = footerEl.querySelector('.footer-newsletter-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const nameInput = form.querySelector('.footer-newsletter-name');
      const emailInput = form.querySelector('.footer-newsletter-input');
      const errorDiv = form.querySelector('.footer-newsletter-error');

      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim() : '';

      // Email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        if (errorDiv) {
          errorDiv.textContent = 'Email address is required.';
          errorDiv.style.display = 'block';
        }
        return;
      }
      if (!emailRegex.test(email)) {
        if (errorDiv) {
          errorDiv.textContent = 'Please enter a valid email address.';
          errorDiv.style.display = 'block';
        }
        return;
      }

      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      // Format WhatsApp message
      const message = `Hello MAGIZHVAGAM,\n\nI would like to join the WhatsApp Community.\n\nName:\n${name}\n\nEmail:\n${email}\n\nPlease add me to future updates, festival collections, and announcements.\n\nThank you.`;
      
      let whatsappPhone = (config.contact && config.contact.phone && config.contact.phone.value) ? config.contact.phone.value.replace(/\D/g, '') : '919894086929';
      if (whatsappPhone.length === 10) {
        whatsappPhone = '91' + whatsappPhone;
      }

      const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`;
      
      if (window.showToast) {
        window.showToast('Opening WhatsApp to join community...', 'success');
      }
      
      window.open(whatsappUrl, '_blank');
      if (nameInput) nameInput.value = '';
      if (emailInput) emailInput.value = '';
    });
  }

  window.__mzFooter = {
    render: async function(footerEl) {
      if (!footerEl) return;
      const config = await fetchFooterConfig();
      if (config) {
        footerEl.innerHTML = renderFooter(config);
        footerEl.classList.add('footer-v4-loaded');
        attachNewsletterListener(footerEl, config);
      }
    }
  };

})();
