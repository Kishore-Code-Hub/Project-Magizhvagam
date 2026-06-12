const mongoose = require('mongoose');
require('dotenv').config();

const AboutPageSchema = new mongoose.Schema({
  storyHeading: { type: String, default: '' },
  storyIntro: { type: String, default: '' },
  leftHeading: { type: String, default: '' },
  leftParagraph1: { type: String, default: '' },
  leftParagraph2: { type: String, default: '' },
  image: { type: String, default: '' },
  ctaText: { type: String, default: '' },
  ctaLink: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'aboutpages' });

const AboutPage = mongoose.model('AboutPage', AboutPageSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected.');

    // Remove any existing doc
    await AboutPage.deleteMany({});
    console.log('Deleted existing about pages.');

    // Save a new one
    const doc = new AboutPage({
      storyHeading: 'Test Story Heading',
      storyIntro: 'Test Story Intro Text here.',
      leftHeading: 'Test Left Heading',
      leftParagraph1: 'Test Left Paragraph 1.',
      leftParagraph2: 'Test Left Paragraph 2.',
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176', // unsplash sample image
      ctaText: 'Explore Gifts',
      ctaLink: '/products.html'
    });
    await doc.save();
    console.log('Saved new test AboutPage:', doc);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
