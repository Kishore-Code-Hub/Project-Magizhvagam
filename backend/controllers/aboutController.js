const prisma = require('../services/prisma');

// GET about page
exports.getAbout = async (req, res) => {
  try {
    const doc = await prisma.aboutPage.findFirst({});
    if (!doc) {
      return res.json({ success: true, data: {
        storyHeading: '', storyIntro: '', leftHeading: '', leftParagraph1: '', leftParagraph2: '', image: '',
        heroImage: '', aboutBanner: '', founderImage: '', teamImages: '', timelineImages: '', storyImages: ''
      }});
    }
    res.json({ success: true, data: { ...doc, _id: doc.id } });
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
      image: req.body.image || '',
      heroImage: req.body.heroImage || '',
      aboutBanner: req.body.aboutBanner || '',
      founderImage: req.body.founderImage || '',
      teamImages: req.body.teamImages || '',
      timelineImages: req.body.timelineImages || '',
      storyImages: req.body.storyImages || ''
    };

    let doc = await prisma.aboutPage.findFirst({});
    let updated;
    if (!doc) {
      updated = await prisma.aboutPage.create({
        data: payload
      });
    } else {
      updated = await prisma.aboutPage.update({
        where: { id: doc.id },
        data: {
          ...payload,
          updatedAt: new Date()
        }
      });
    }
    console.log('About PUT saved image:', payload.image);
    res.json({ success: true, data: { ...updated, _id: updated.id } });
  } catch (err) {
    console.error('About PUT error', err);
    res.status(500).json({ success: false, error: 'Failed to update about page' });
  }
};
