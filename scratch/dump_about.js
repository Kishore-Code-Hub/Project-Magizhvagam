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
}, { collection: 'aboutpages' }); // check default name or custom name

const AboutPage = mongoose.model('AboutPage', AboutPageSchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');

    const doc = await AboutPage.findOne({});
    console.log('AboutPage document in DB:', doc);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error connecting/querying:', err);
  }
}

run();
