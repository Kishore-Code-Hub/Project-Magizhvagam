const prisma = require('../services/prisma');

const FILTER_ACTIVE = { id: 'active' };
const MAX_HISTORY_PER_COLLECTION = 50;

/**
 * Save a snapshot to history before overwriting
 */
async function saveHistory(collectionName, currentDoc, userId) {
  if (!currentDoc) return;

  try {
    // Deep copy document and clean up metadata
    const snapshot = { ...currentDoc };
    delete snapshot.id;
    delete snapshot.updatedAt;

    await prisma.siteSettingsHistory.create({
      data: {
        savedBy: userId || null,
        configCollection: collectionName,
        version: currentDoc.version || 0,
        snapshot: snapshot
      }
    });

    // Prune old history — keep last MAX_HISTORY_PER_COLLECTION
    const allHistory = await prisma.siteSettingsHistory.findMany({
      where: { configCollection: collectionName },
      orderBy: { savedAt: 'desc' }
    });

    if (allHistory.length > MAX_HISTORY_PER_COLLECTION) {
      const toDelete = allHistory.slice(MAX_HISTORY_PER_COLLECTION);
      await prisma.siteSettingsHistory.deleteMany({
        where: { id: { in: toDelete.map(h => h.id) } }
      });
    }
  } catch (err) {
    console.error(`[siteSettings] Failed to save history for ${collectionName}:`, err.message);
  }
}

/**
 * Ensure a config document exists, creating with defaults if needed
 */
async function ensureDoc(modelName, defaultData) {
  let doc = await prisma[modelName].findUnique({
    where: FILTER_ACTIVE
  });
  if (!doc) {
    doc = await prisma[modelName].create({
      data: {
        id: 'active',
        ...defaultData
      }
    });
  }

  // Inject compat field _id for admin page frontend
  return {
    ...doc,
    _id: doc.id
  };
}

// ─── GET ALL (boot-time bundle) ─────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/all
 * @access  Public
 */
exports.getAll = async (req, res) => {
  try {
    const [theme, homepage, navigation, footer, animation] = await Promise.all([
      ensureDoc('siteSettings', { theme: {}, typography: {}, layout: {}, meta: {} }),
      ensureDoc('homepageSections', { sections: [] }),
      ensureDoc('navigationConfig', { desktop: {}, mobile: {} }),
      ensureDoc('footerConfig', {
        brand: {},
        columns: [],
        social: [],
        contact: {},
        newsletter: {},
        copyright: {}
      }),
      ensureDoc('animationConfig', { preset: 'elevated', overrides: {} })
    ]);

    res.status(200).json({
      success: true,
      data: { theme, homepage, navigation, footer, animation }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching all settings: ${error.message}` });
  }
};

// ─── THEME ──────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/theme
 * @access  Public
 */
exports.getTheme = async (req, res) => {
  try {
    const doc = await ensureDoc('siteSettings', { theme: {}, typography: {}, layout: {}, meta: {} });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching theme: ${error.message}` });
  }
};

/**
 * @route   PUT /api/site-settings/theme
 * @access  Private (Admin Only)
 */
exports.updateTheme = async (req, res) => {
  try {
    const currentDoc = await ensureDoc('siteSettings', { theme: {}, typography: {}, layout: {}, meta: {} });
    await saveHistory('site_settings_v4', currentDoc, req.user?.id);

    const { theme, typography, layout, meta, customCss } = req.body;

    const updated = await prisma.siteSettings.update({
      where: FILTER_ACTIVE,
      data: {
        theme: theme || {},
        typography: typography || {},
        layout: layout || {},
        meta: meta || {},
        customCss: customCss !== undefined ? customCss : currentDoc.customCss,
        version: (currentDoc.version || 0) + 1,
        updatedAt: new Date(),
        updatedBy: req.user?.id || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Theme updated successfully',
      data: { ...updated, _id: updated.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating theme: ${error.message}` });
  }
};

// ─── HOMEPAGE SECTIONS ──────────────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/homepage
 * @access  Public
 */
exports.getHomepage = async (req, res) => {
  try {
    const doc = await ensureDoc('homepageSections', { sections: [] });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching homepage: ${error.message}` });
  }
};

/**
 * @route   PUT /api/site-settings/homepage
 * @access  Private (Admin Only)
 */
exports.updateHomepage = async (req, res) => {
  try {
    const { sections } = req.body;

    if (sections && Array.isArray(sections)) {
      const validIds = [
        'hero',
        'categories',
        'flash-sale',
        'featured',
        'promotional-banner-1',
        'best-sellers',
        'new-arrivals',
        'trending',
        'promotional-banner-2',
        'recommended',
        'services-trust',
        'instagram-feed'
      ];
      for (const section of sections) {
        if (!validIds.includes(section.id)) {
          return res.status(400).json({ success: false, error: `Invalid section ID: ${section.id}` });
        }
      }

      const orders = sections.map(s => s.order);
      if (new Set(orders).size !== orders.length) {
        return res.status(400).json({ success: false, error: 'Section order values must be unique' });
      }
    }

    const currentDoc = await ensureDoc('homepageSections', { sections: [] });
    await saveHistory('homepage_sections_v4', currentDoc, req.user?.id);

    const updated = await prisma.homepageSections.update({
      where: FILTER_ACTIVE,
      data: {
        sections: sections || [],
        version: (currentDoc.version || 0) + 1,
        updatedAt: new Date(),
        updatedBy: req.user?.id || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Homepage updated successfully',
      data: { ...updated, _id: updated.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating homepage: ${error.message}` });
  }
};

// ─── NAVIGATION ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/navigation
 * @access  Public
 */
exports.getNavigation = async (req, res) => {
  try {
    const doc = await ensureDoc('navigationConfig', { desktop: {}, mobile: {} });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching navigation: ${error.message}` });
  }
};

/**
 * @route   PUT /api/site-settings/navigation
 * @access  Private (Admin Only)
 */
exports.updateNavigation = async (req, res) => {
  try {
    const currentDoc = await ensureDoc('navigationConfig', { desktop: {}, mobile: {} });
    await saveHistory('navigation_config_v4', currentDoc, req.user?.id);

    const { desktop, mobile } = req.body;

    const updated = await prisma.navigationConfig.update({
      where: FILTER_ACTIVE,
      data: {
        desktop: desktop || {},
        mobile: mobile || {},
        version: (currentDoc.version || 0) + 1,
        updatedAt: new Date(),
        updatedBy: req.user?.id || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Navigation updated successfully',
      data: { ...updated, _id: updated.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating navigation: ${error.message}` });
  }
};

// ─── FOOTER ─────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/footer
 * @access  Public
 */
exports.getFooter = async (req, res) => {
  try {
    const doc = await ensureDoc('footerConfig', {
      brand: {},
      columns: [],
      social: [],
      contact: {},
      newsletter: {},
      copyright: {}
    });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching footer: ${error.message}` });
  }
};

/**
 * @route   PUT /api/site-settings/footer
 * @access  Private (Admin Only)
 */
exports.updateFooter = async (req, res) => {
  try {
    const currentDoc = await ensureDoc('footerConfig', {
      brand: {},
      columns: [],
      social: [],
      contact: {},
      newsletter: {},
      copyright: {}
    });
    await saveHistory('footer_config_v4', currentDoc, req.user?.id);

    const { brand, columnCount, columns, social, contact, newsletter, copyright } = req.body;

    const updated = await prisma.footerConfig.update({
      where: FILTER_ACTIVE,
      data: {
        brand: brand || {},
        columnCount: columnCount !== undefined ? Number(columnCount) : currentDoc.columnCount,
        columns: columns || [],
        social: social || [],
        contact: contact || {},
        newsletter: newsletter || {},
        copyright: copyright || {},
        version: (currentDoc.version || 0) + 1,
        updatedAt: new Date(),
        updatedBy: req.user?.id || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Footer updated successfully',
      data: { ...updated, _id: updated.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating footer: ${error.message}` });
  }
};

// ─── ANIMATION ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/animation
 * @access  Public
 */
exports.getAnimation = async (req, res) => {
  try {
    const doc = await ensureDoc('animationConfig', { preset: 'elevated', overrides: {} });
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching animation: ${error.message}` });
  }
};

/**
 * @route   PUT /api/site-settings/animation
 * @access  Private (Admin Only)
 */
exports.updateAnimation = async (req, res) => {
  try {
    const currentDoc = await ensureDoc('animationConfig', { preset: 'elevated', overrides: {} });
    await saveHistory('animation_config_v4', currentDoc, req.user?.id);

    const { preset, overrides } = req.body;

    const updated = await prisma.animationConfig.update({
      where: FILTER_ACTIVE,
      data: {
        preset: preset || 'elevated',
        overrides: overrides || {},
        version: (currentDoc.version || 0) + 1,
        updatedAt: new Date(),
        updatedBy: req.user?.id || null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Animation config updated successfully',
      data: { ...updated, _id: updated.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error updating animation: ${error.message}` });
  }
};

// ─── PREVIEW & ROLLBACK ─────────────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/preview/:version
 * @access  Private (Admin Only)
 */
exports.getPreview = async (req, res) => {
  try {
    const version = parseInt(req.params.version);
    if (isNaN(version)) {
      return res.status(400).json({ success: false, error: 'Invalid version number' });
    }

    const snapshot = await prisma.siteSettingsHistory.findFirst({
      where: { configCollection: 'site_settings_v4', version }
    });
    if (!snapshot) {
      return res.status(404).json({ success: false, error: `Version ${version} not found in history` });
    }

    res.status(200).json({ success: true, data: snapshot.snapshot });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching preview: ${error.message}` });
  }
};

/**
 * @route   POST /api/site-settings/rollback
 * @access  Private (Admin Only)
 */
exports.rollback = async (req, res) => {
  try {
    const { collection, version } = req.body;

    if (!collection || version === undefined) {
      return res.status(400).json({ success: false, error: 'Please provide collection and version' });
    }

    const snapshot = await prisma.siteSettingsHistory.findFirst({
      where: { configCollection: collection, version: parseInt(version) }
    });
    if (!snapshot) {
      return res.status(404).json({ success: false, error: `Version ${version} not found for ${collection}` });
    }

    const modelMap = {
      'site_settings_v4': 'siteSettings',
      'homepage_sections_v4': 'homepageSections',
      'navigation_config_v4': 'navigationConfig',
      'footer_config_v4': 'footerConfig',
      'animation_config_v4': 'animationConfig'
    };

    const modelName = modelMap[collection];
    if (!modelName) {
      return res.status(400).json({ success: false, error: `Unknown collection: ${collection}` });
    }

    const currentDoc = await prisma[modelName].findUnique({ where: FILTER_ACTIVE });
    await saveHistory(collection, currentDoc, req.user?.id);

    const restoreData = typeof snapshot.snapshot === 'string' ? JSON.parse(snapshot.snapshot) : snapshot.snapshot;
    delete restoreData.id;
    delete restoreData._id;

    restoreData.version = (currentDoc?.version || 0) + 1;
    restoreData.updatedAt = new Date();
    restoreData.updatedBy = req.user?.id || null;

    const restored = await prisma[modelName].update({
      where: FILTER_ACTIVE,
      data: restoreData
    });

    res.status(200).json({
      success: true,
      message: `Rolled back ${collection} to version ${version}`,
      data: { ...restored, _id: restored.id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `Rollback error: ${error.message}` });
  }
};

/**
 * @route   GET /api/site-settings/history/:collection
 * @access  Private (Admin Only)
 */
exports.getHistory = async (req, res) => {
  try {
    const { collection } = req.params;
    const history = await prisma.siteSettingsHistory.findMany({
      where: { configCollection: collection },
      orderBy: { savedAt: 'desc' },
      take: 20
    });

    const compatHistory = history.map(h => ({
      ...h,
      _id: h.id
    }));

    res.status(200).json({ success: true, data: compatHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching history: ${error.message}` });
  }
};
