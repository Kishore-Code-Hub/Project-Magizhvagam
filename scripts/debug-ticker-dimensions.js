const { chromium } = require('playwright');

(async () => {
  console.log('=== Checking Ticker Dimensions and Colors ===');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5000/');
  await page.waitForTimeout(3000);

  const stats = await page.evaluate(() => {
    const section = document.querySelector('.infinite-product-ticker-section');
    const wrapper = document.querySelector('.ticker-wrapper');
    const track = document.getElementById('infinite-ticker-track');
    const item = document.querySelector('.ticker-item');

    return {
      section: section ? {
        rect: section.getBoundingClientRect(),
        display: getComputedStyle(section).display,
        visibility: getComputedStyle(section).visibility,
        opacity: getComputedStyle(section).opacity,
        height: getComputedStyle(section).height,
        background: getComputedStyle(section).background,
        zIndex: getComputedStyle(section).zIndex
      } : null,
      wrapper: wrapper ? {
        rect: wrapper.getBoundingClientRect(),
        display: getComputedStyle(wrapper).display,
        height: getComputedStyle(wrapper).height
      } : null,
      track: track ? {
        rect: track.getBoundingClientRect(),
        transform: getComputedStyle(track).transform,
        animationName: getComputedStyle(track).animationName,
        animationPlayState: getComputedStyle(track).animationPlayState
      } : null,
      item: item ? {
        rect: item.getBoundingClientRect(),
        display: getComputedStyle(item).display,
        color: getComputedStyle(item).color,
        background: getComputedStyle(item).background,
        text: item.innerText
      } : null
    };
  });

  console.log('Section:', JSON.stringify(stats.section, null, 2));
  console.log('Wrapper:', JSON.stringify(stats.wrapper, null, 2));
  console.log('Track:', JSON.stringify(stats.track, null, 2));
  console.log('Item Sample:', JSON.stringify(stats.item, null, 2));

  await browser.close();
})();
