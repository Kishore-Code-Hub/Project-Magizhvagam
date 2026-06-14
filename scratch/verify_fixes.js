const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\kisho\\.gemini\\antigravity-ide\\brain\\78095096-0843-4d78-85fc-ed7a5e3a8dad';
if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  });
  
  // Clear any existing cookies or localStorage items
  const page = await context.newPage();

  console.log('Fetching a valid product ID...');
  await page.goto('http://localhost:5000/api/products');
  const bodyText = await page.textContent('body');
  const productsData = JSON.parse(bodyText);
  if (!productsData.success || !productsData.products || productsData.products.length === 0) {
    throw new Error('No products found to test details page.');
  }
  const product = productsData.products[0];
  const productId = product._id;
  console.log(`Using product ID: ${productId} (${product.name})`);

  // Navigate to Product Details Page
  console.log(`Navigating to details page for product ${productId}...`);
  await page.goto(`http://localhost:5000/product-details.html?id=${productId}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. QUANTITY HOLD-TO-REPEAT ON DETAILS PAGE
  const qtyInput = await page.locator('#details-qty-input');
  const initialQtyVal = Number(await qtyInput.inputValue());
  console.log(`Initial details quantity: ${initialQtyVal}`);

  console.log('Simulating long press on "+" button for 1000ms...');
  const plusBtn = await page.locator('.qty-btn.qty-plus');
  
  // Touch start
  const plusBox = await plusBtn.boundingBox();
  const plusCenterX = plusBox.x + plusBox.width / 2;
  const plusCenterY = plusBox.y + plusBox.height / 2;
  
  await page.mouse.move(plusCenterX, plusCenterY);
  await page.mouse.down();
  await page.waitForTimeout(1000); // 500ms delay + 5 ticks (500ms repeat) = ~6 increments
  await page.mouse.up();
  await page.waitForTimeout(500); // wait for state sync

  const qtyAfterPlus = Number(await qtyInput.inputValue());
  console.log(`Details quantity after long press "+": ${qtyAfterPlus}`);
  
  if (qtyAfterPlus > initialQtyVal + 2) {
    console.log('✅ Success: Quantity Hold-to-Repeat "+" works on Details page!');
  } else {
    console.error(`❌ Failure: Quantity didn't repeat correctly. Got ${qtyAfterPlus}, expected > ${initialQtyVal + 2}`);
  }

  // 2. WHATSAPP MODAL BLANK/VALIDATION TEST
  console.log('Clicking WhatsApp order button as Guest User...');
  const waBtn = await page.locator('button:has-text("Order & Inquire via WhatsApp")');
  await waBtn.click();
  await page.waitForTimeout(500);

  const confirmModal = await page.locator('#whatsapp-confirm-modal');
  if (await confirmModal.isVisible()) {
    console.log('✅ Success: WhatsApp confirmation modal is visible!');
  } else {
    throw new Error('❌ Failure: WhatsApp confirmation modal not visible.');
  }

  // Save screenshot of modal inputs
  await page.screenshot({ path: path.join(artifactDir, 'whatsapp_modal_inputs.png') });
  console.log('Saved screenshot of WhatsApp modal inputs.');

  // Try to submit with blank values
  console.log('Clicking confirm with empty inputs to trigger validation errors...');
  const confirmModalBtn = await page.locator('#confirm-whatsapp-btn');
  await confirmModalBtn.click();
  await page.waitForTimeout(300);

  const nameError = await page.locator('#wa-name-error');
  const phoneError = await page.locator('#wa-phone-error');
  
  if (await nameError.isVisible() && await phoneError.isVisible()) {
    console.log('✅ Success: Validation errors for empty name/phone are displayed correctly!');
  } else {
    console.error('❌ Failure: Validation errors for empty inputs did not show.');
  }

  // Save screenshot of validation errors
  await page.screenshot({ path: path.join(artifactDir, 'whatsapp_modal_validation_errors.png') });
  console.log('Saved screenshot of WhatsApp modal validation errors.');

  // Fill in invalid inputs (e.g. name < 2 chars, phone not 10 digits)
  console.log('Filling in invalid details to verify regex validation...');
  await page.fill('#wa-customer-name', 'K');
  await page.fill('#wa-customer-phone', '123456');
  await confirmModalBtn.click();
  await page.waitForTimeout(300);

  if (await nameError.isVisible() && await phoneError.isVisible()) {
    console.log('✅ Success: Validation errors for invalid name/phone format are displayed correctly!');
  } else {
    console.error('❌ Failure: Validation errors for invalid name/phone did not show.');
  }

  // Capture redirection url
  let interceptedUrl = null;
  page.on('popup', async (popup) => {
    interceptedUrl = popup.url();
    console.log(`Intercepted Popup URL: ${interceptedUrl}`);
    await popup.close();
  });

  // Fill in valid inputs
  console.log('Filling in valid details (Kishore, 9876543210)...');
  await page.fill('#wa-customer-name', 'Kishore');
  await page.fill('#wa-customer-phone', '9876543210');
  await confirmModalBtn.click();
  await page.waitForTimeout(1000); // Wait for popup intercept

  if (interceptedUrl) {
    console.log('✅ Success: WhatsApp redirect intercepted!');
    const decodedUrl = decodeURIComponent(interceptedUrl);
    console.log(`Decoded message payload:\n${decodedUrl}`);

    // Verify Name, Phone, and NO undefined/null/[object Object]
    const hasName = decodedUrl.includes('Name: Kishore');
    const hasPhone = decodedUrl.includes('Phone: 9876543210');
    const hasProductId = decodedUrl.includes(productId);
    const hasUndefined = decodedUrl.includes('undefined');
    const hasNull = decodedUrl.includes('null');
    const hasObject = decodedUrl.includes('[object');

    if (hasName && hasPhone && hasProductId && !hasUndefined && !hasNull && !hasObject) {
      console.log('✅ Success: Payload verified successfully with correct values and no leakage!');
    } else {
      console.error(`❌ Failure: Payload validation failed. hasName=${hasName}, hasPhone=${hasPhone}, hasProductId=${hasProductId}, hasUndefined=${hasUndefined}, hasNull=${hasNull}, hasObject=${hasObject}`);
    }
  } else {
    console.error('❌ Failure: WhatsApp redirect did not happen or popup was not intercepted.');
  }

  // 3. CART PAGE TEST
  console.log('Adding product to shopping cart...');
  await page.locator('#btn-add-cart').click();
  await page.waitForTimeout(1000);

  console.log('Navigating to Shopping Cart...');
  await page.goto('http://localhost:5000/cart.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Measure initial quantity in cart
  const cartQtySpan = await page.locator('#cart-items-container span[style*="width:40px"]');
  const cartQtyInitial = Number(await cartQtySpan.textContent());
  console.log(`Initial Cart Quantity: ${cartQtyInitial}`);

  console.log('Simulating long press on "+" button inside Cart...');
  const cartPlusBtn = await page.locator('#cart-items-container .qty-btn.qty-plus');
  const cartPlusBox = await cartPlusBtn.boundingBox();
  const cartPlusCenterX = cartPlusBox.x + cartPlusBox.width / 2;
  const cartPlusCenterY = cartPlusBox.y + cartPlusBox.height / 2;

  await page.mouse.move(cartPlusCenterX, cartPlusCenterY);
  await page.mouse.down();
  await page.waitForTimeout(1200); // hold for repeat to kick in
  await page.mouse.up();
  await page.waitForTimeout(1000); // wait for cart refresh and recalculations

  // Re-fetch quantity element since cart items re-rendered
  const cartQtySpanAfter = await page.locator('#cart-items-container span[style*="width:40px"]');
  const cartQtyAfterPlus = Number(await cartQtySpanAfter.textContent());
  console.log(`Cart quantity after long press "+": ${cartQtyAfterPlus}`);

  if (cartQtyAfterPlus > cartQtyInitial + 1) {
    console.log('✅ Success: Quantity Hold-to-Repeat "+" works on Cart Page!');
  } else {
    console.error(`❌ Failure: Cart quantity did not repeat. Got ${cartQtyAfterPlus}, expected > ${cartQtyInitial + 1}`);
  }

  await browser.close();
  console.log('Verification run finished!');
}

run().catch(console.error);
