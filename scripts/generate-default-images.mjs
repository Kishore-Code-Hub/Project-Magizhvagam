import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const imagesDir = path.join(root, 'assets', 'images');
const productsDir = path.join(imagesDir, 'products');

const files = [
  { name: 'default-product.webp', color: '#E8E4F0', label: 'Gift' },
  { name: 'default-category.webp', color: '#F3E8FF', label: 'Category' },
  { name: 'default-banner.webp', color: '#FDF4FF', label: 'Banner' },
  { name: 'default-avatar.webp', color: '#EDE9FE', label: 'User' },
  { name: 'products/placeholder.webp', color: '#FAF9F6', label: 'Product' },
  { name: 'products/kumkum_holder.jpg', color: '#FFF8E7', label: 'Kumkum' },
  { name: 'products/jute_bag.jpg', color: '#F5F0E8', label: 'Jute Bag' },
  { name: 'products/wooden_box.jpg', color: '#8B4513', label: 'Wood Box' },
  { name: 'products/puja_plate.jpg', color: '#C0C0C0', label: 'Puja Plate' },
  { name: 'products/ganesha_idol.jpg', color: '#E2725B', label: 'Ganesha' },
  { name: 'products/ganesha_leaf.jpg', color: '#86EFAC', label: 'Ganesha Leaf' },
  { name: 'products/kids_mug.jpg', color: '#93C5FD', label: 'Kids Mug' },
  { name: 'products/pen_set.jpg', color: '#4A5568', label: 'Pen Set' },
  { name: 'products/candle_set.jpg', color: '#FED7AA', label: 'Candles' },
  { name: 'products/silver_coin.jpg', color: '#E2E8F0', label: 'Silver' },
  { name: 'products/tote_bag.jpg', color: '#FEF3C7', label: 'Tote' },
  { name: 'products/keychain.jpg', color: '#DDD6FE', label: 'Keychain' },
  { name: 'categories/birthday.jpg', color: '#FBCFE8', label: 'Birthday' },
  { name: 'categories/wedding.jpg', color: '#FECDD3', label: 'Wedding' },
  { name: 'categories/babyshower.jpg', color: '#BFDBFE', label: 'Baby Shower' },
  { name: 'categories/corporate.jpg', color: '#CBD5E1', label: 'Corporate' },
  { name: 'categories/festival.jpg', color: '#FDE68A', label: 'Festival' },
  { name: 'categories/kids.jpg', color: '#A7F3D0', label: 'Kids' },
  { name: 'categories/customized.jpg', color: '#C4B5FD', label: 'Custom' },
  { name: 'categories/ecofriendly.jpg', color: '#BBF7D0', label: 'Eco' },
  { name: 'banners/hero_slide_1.jpg', color: '#E9D5FF', label: 'Hero 1' },
  { name: 'banners/hero_slide_2.jpg', color: '#FBCFE8', label: 'Hero 2' },
  { name: 'banners/promo_1.jpg', color: '#FEF08A', label: 'Promo 1' },
  { name: 'banners/promo_2.jpg', color: '#BAE6FD', label: 'Promo 2' }
];

async function createPlaceholder({ name, color, label }) {
  const outPath = path.join(imagesDir, name);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const ext = path.extname(name).toLowerCase();
  const svg = `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="800" fill="${color}"/>
      <text x="400" y="400" font-family="Arial, sans-serif" font-size="42" fill="#6B5B7A" text-anchor="middle" dominant-baseline="middle">${label}</text>
    </svg>`;
  const buffer = Buffer.from(svg);
  if (ext === '.jpg' || ext === '.jpeg') {
    await sharp(buffer).jpeg({ quality: 85 }).toFile(outPath);
  } else {
    await sharp(buffer).webp({ quality: 85 }).toFile(outPath);
  }
  console.log('Created', outPath);
}

fs.mkdirSync(productsDir, { recursive: true });
for (const file of files) {
  await createPlaceholder(file);
}
