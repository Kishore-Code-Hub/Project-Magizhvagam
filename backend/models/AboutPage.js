const mongoose = require('mongoose');

const AboutPageSchema = new mongoose.Schema({
  storyHeading: { type: String, default: '' },
  storyIntro: { type: String, default: '' },
  leftHeading: { type: String, default: '' },
  leftParagraph1: { type: String, default: '' },
  leftParagraph2: { type: String, default: '' },
  image: { type: String, default: '' }, // URL to uploaded image
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AboutPage', AboutPageSchema);
