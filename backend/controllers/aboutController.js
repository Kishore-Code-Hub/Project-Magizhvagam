const AboutPage = require('../models/AboutPage');

// GET about page
exports.getAbout = async (req, res) => {
  try {
    let doc = await AboutPage.findOne({});
    if (!doc) {
      // return empty structure
      return res.json({ success: true, data: {
        storyHeading: '', storyIntro: '', leftHeading: '', leftParagraph1: '', leftParagraph2: '', image: ''
      }});
    }
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('About GET error', err);
    res.status(500).json({ success: false, error: 'Failed to load about page' });
  }
};

// PUT about page (admin only)
exports.updateAbout = async (req, res) => {
  try {
    const payload = {
      storyHeading: req.body.storyHeading || '',
      storyIntro: req.body.storyIntro || '',
      leftHeading: req.body.leftHeading || '',
      leftParagraph1: req.body.leftParagraph1 || '',
      leftParagraph2: req.body.leftParagraph2 || '',
      image: req.body.image || ''
    };

    let doc = await AboutPage.findOne({});
    if (!doc) {
      doc = new AboutPage(payload);
    } else {
      Object.assign(doc, payload);
      doc.updatedAt = Date.now();
    }
    await doc.save();
    console.log('About PUT saved image:', payload.image);
    res.json({ success: true, data: doc });
  } catch (err) {
    console.error('About PUT error', err);
    res.status(500).json({ success: false, error: 'Failed to update about page' });
  }
};
