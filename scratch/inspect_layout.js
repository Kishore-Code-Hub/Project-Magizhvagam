const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('--- DIAGNOSTIC RUN FOR LOGIN PAGE LAYOUT & MOBILE HEADER ---');

  try {
    await page.goto('http://localhost:5000/login.html');
    await page.waitForTimeout(1000);

    // 1. Inspect Header elements positioning
    const headerDetails = await page.evaluate(() => {
      const header = document.getElementById('main-header');
      const row1 = document.querySelector('.header-row-1');
      const leftSlot = document.querySelector('.header-left-slot');
      const hamburger = document.getElementById('hamburger-btn');
      const logo = document.getElementById('header-logo');
      const utilities = document.getElementById('header-utilities-right');

      const getRect = (el) => el ? {
        tag: el.tagName,
        class: el.className,
        top: el.getBoundingClientRect().top,
        left: el.getBoundingClientRect().left,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height
      } : null;

      const getStyles = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          display: s.display,
          position: s.position,
          top: s.top,
          left: s.left,
          marginTop: s.marginTop,
          marginBottom: s.marginBottom,
          paddingTop: s.paddingTop,
          paddingBottom: s.paddingBottom,
          flexDirection: s.flexDirection,
          alignItems: s.alignItems,
          justifyContent: s.justifyContent
        };
      };

      return {
        headerStyles: getStyles(header),
        row1Styles: getStyles(row1),
        leftSlotStyles: getStyles(leftSlot),
        hamburgerStyles: getStyles(hamburger),
        logoStyles: getStyles(logo),
        utilitiesStyles: getStyles(utilities),
        rects: {
          header: getRect(header),
          row1: getRect(row1),
          leftSlot: getRect(leftSlot),
          hamburger: getRect(hamburger),
          logo: getRect(logo),
          utilities: getRect(utilities)
        }
      };
    });

    console.log('\n=== HEADER AND ROW-1 LAYOUT DETAILS ===');
    console.log(JSON.stringify(headerDetails, null, 2));

    // 2. Inspect Spacing and Wrapper elements
    const pageSpacing = await page.evaluate(() => {
      const body = document.body;
      const authWrapper = document.querySelector('.auth-wrapper');
      const authCard = document.querySelector('.auth-card');
      const footer = document.getElementById('main-footer');

      const getStyles = (el) => {
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          height: s.height,
          minHeight: s.minHeight,
          marginTop: s.marginTop,
          marginBottom: s.marginBottom,
          paddingTop: s.paddingTop,
          paddingBottom: s.paddingBottom,
          display: s.display,
          flexDirection: s.flexDirection,
          gap: s.gap
        };
      };

      const getRect = (el) => el ? {
        top: el.getBoundingClientRect().top,
        bottom: el.getBoundingClientRect().bottom,
        height: el.getBoundingClientRect().height
      } : null;

      return {
        bodyStyles: getStyles(body),
        authWrapperStyles: getStyles(authWrapper),
        authCardStyles: getStyles(authCard),
        footerStyles: getStyles(footer),
        rects: {
          body: getRect(body),
          authWrapper: getRect(authWrapper),
          authCard: getRect(authCard),
          footer: getRect(footer)
        }
      };
    });

    console.log('\n=== PAGE SPACING AND WRAPPERS DETAILS ===');
    console.log(JSON.stringify(pageSpacing, null, 2));

  } catch (err) {
    console.error('Error executing layout diagnostic:', err);
  }

  await browser.close();
})();
