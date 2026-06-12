/**
 * MAGIZHVAGAM V4 — Site Settings Controller
 * 
 * All appearance CRUD logic using the database abstraction layer.
 * Handles theme, homepage sections, navigation, footer, and animation configs.
 * Auto-versions and creates history snapshots on every write.
 */

const SiteSettings = require('../models/SiteSettings');
const HomepageSections = require('../models/HomepageSections');
const NavigationConfig = require('../models/NavigationConfig');
const FooterConfig = require('../models/FooterConfig');
const AnimationConfig = require('../models/AnimationConfig');
const SiteSettingsHistory = require('../models/SiteSettingsHistory');
const { createAdapter } = require('../services/dbAdapter');

// ─── Adapter Instances ──────────────────────────────────────────────────────
const settingsDb = createAdapter(SiteSettings, 'site_settings_v4');
const homepageDb = createAdapter(HomepageSections, 'homepage_sections_v4');
const navDb = createAdapter(NavigationConfig, 'navigation_config_v4');
const footerDb = createAdapter(FooterConfig, 'footer_config_v4');
const animDb = createAdapter(AnimationConfig, 'animation_config_v4');
const historyDb = createAdapter(SiteSettingsHistory, 'site_settings_history');

// ─── Helpers ────────────────────────────────────────────────────────────────

const FILTER_ACTIVE = { _id: 'active' };
const MAX_HISTORY_PER_COLLECTION = 50;

/**
 * Save a snapshot to history before overwriting
 */
async function saveHistory(collectionName, currentDoc, userId) {
  if (!currentDoc) return;

  try {
    await historyDb.create({
      savedAt: new Date(),
      savedBy: userId || null,
      configCollection: collectionName,
      version: currentDoc.version || 0,
      snapshot: JSON.parse(JSON.stringify(currentDoc))
    });

    // Prune old history — keep last MAX_HISTORY_PER_COLLECTION
    const allHistory = await historyDb.findMany(
      { configCollection: collectionName },
      { sort: { savedAt: -1 } }
    );

    if (allHistory.length > MAX_HISTORY_PER_COLLECTION) {
      const toDelete = allHistory.slice(MAX_HISTORY_PER_COLLECTION);
      for (const item of toDelete) {
        await historyDb.delete({ _id: item._id });
      }
    }
  } catch (err) {
    console.error(`[siteSettings] Failed to save history for ${collectionName}:`, err.message);
  }
}

/**
 * Ensure a config document exists, creating with defaults if needed
 */
async function ensureDoc(db, collectionName) {
  let doc = await db.findOne(FILTER_ACTIVE);
  if (!doc) {
    doc = await db.upsert(FILTER_ACTIVE, { _id: 'active' });
  }
  return doc;
}

// ─── GET ALL (boot-time bundle) ─────────────────────────────────────────────

/**
 * @route   GET /api/site-settings/all
 * @access  Public
 */
exports.getAll = async (req, res) => {
  try {
    const [theme, homepage, navigation, footer, animation] = await Promise.all([
      ensureDoc(settingsDb, 'site_settings_v4'),
      ensureDoc(homepageDb, 'homepage_sections_v4'),
      ensureDoc(navDb, 'navigation_config_v4'),
      ensureDoc(footerDb, 'footer_config_v4'),
      ensureDoc(animDb, 'animation_config_v4')
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
 * @access  Public (used by theme-loader.js)
 */
exports.getTheme = async (req, res) => {
  try {
    const doc = await ensureDoc(settingsDb, 'site_settings_v4');
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
    const currentDoc = await ensureDoc(settingsDb, 'site_settings_v4');
    await saveHistory('site_settings_v4', currentDoc, req.user?._id);

    const updates = { ...req.body };
    updates.version = (currentDoc.version || 0) + 1;
    updates.updatedAt = new Date();
    updates.updatedBy = req.user?._id || null;

    const updated = await settingsDb.upsert(FILTER_ACTIVE, updates);
    res.status(200).json({ success: true, message: 'Theme updated successfully', data: updated });
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
    const doc = await ensureDoc(homepageDb, 'homepage_sections_v4');
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

    // Validate section IDs
    if (sections && Array.isArray(sections)) {
      const validIds = HomepageSections.SECTION_IDS;
      for (const section of sections) {
        if (!validIds.includes(section.id)) {
          return res.status(400).json({ success: false, error: `Invalid section ID: ${section.id}` });
        }
      }

      // Validate unique order values
      const orders = sections.map(s => s.order);
      if (new Set(orders).size !== orders.length) {
        return res.status(400).json({ success: false, error: 'Section order values must be unique' });
      }
    }

    const currentDoc = await ensureDoc(homepageDb, 'homepage_sections_v4');
    await saveHistory('homepage_sections_v4', currentDoc, req.user?._id);

    const updates = { ...req.body };
    updates.version = (currentDoc.version || 0) + 1;
    updates.updatedAt = new Date();
    updates.updatedBy = req.user?._id || null;

    const updated = await homepageDb.upsert(FILTER_ACTIVE, updates);
    res.status(200).json({ success: true, message: 'Homepage updated successfully', data: updated });
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
    const doc = await ensureDoc(navDb, 'navigation_config_v4');
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
    const currentDoc = await ensureDoc(navDb, 'navigation_config_v4');
    await saveHistory('navigation_config_v4', currentDoc, req.user?._id);

    const updates = { ...req.body };
    updates.version = (currentDoc.version || 0) + 1;
    updates.updatedAt = new Date();
    updates.updatedBy = req.user?._id || null;

    const updated = await navDb.upsert(FILTER_ACTIVE, updates);
    res.status(200).json({ success: true, message: 'Navigation updated successfully', data: updated });
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
    const doc = await ensureDoc(footerDb, 'footer_config_v4');
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
    const currentDoc = await ensureDoc(footerDb, 'footer_config_v4');
    await saveHistory('footer_config_v4', currentDoc, req.user?._id);

    const updates = { ...req.body };
    updates.version = (currentDoc.version || 0) + 1;
    updates.updatedAt = new Date();
    updates.updatedBy = req.user?._id || null;

    const updated = await footerDb.upsert(FILTER_ACTIVE, updates);
    res.status(200).json({ success: true, message: 'Footer updated successfully', data: updated });
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
    const doc = await ensureDoc(animDb, 'animation_config_v4');
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
    const currentDoc = await ensureDoc(animDb, 'animation_config_v4');
    await saveHistory('animation_config_v4', currentDoc, req.user?._id);

    const updates = { ...req.body };
    updates.version = (currentDoc.version || 0) + 1;
    updates.updatedAt = new Date();
    updates.updatedBy = req.user?._id || null;

    const updated = await animDb.upsert(FILTER_ACTIVE, updates);
    res.status(200).json({ success: true, message: 'Animation config updated successfully', data: updated });
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

    const snapshot = await historyDb.findOne({ configCollection: 'site_settings_v4', version });
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
 * @body    { collection: string, version: number }
 */
exports.rollback = async (req, res) => {
  try {
    const { collection, version } = req.body;

    if (!collection || version === undefined) {
      return res.status(400).json({ success: false, error: 'Please provide collection and version' });
    }

    // Find the snapshot to restore
    const snapshot = await historyDb.findOne({ configCollection: collection, version: parseInt(version) });
    if (!snapshot) {
      return res.status(404).json({ success: false, error: `Version ${version} not found for ${collection}` });
    }

    // Map collection names to adapters
    const adapterMap = {
      'site_settings_v4': settingsDb,
      'homepage_sections_v4': homepageDb,
      'navigation_config_v4': navDb,
      'footer_config_v4': footerDb,
      'animation_config_v4': animDb
    };

    const adapter = adapterMap[collection];
    if (!adapter) {
      return res.status(400).json({ success: false, error: `Unknown collection: ${collection}` });
    }

    // Save current state to history first
    const currentDoc = await adapter.findOne(FILTER_ACTIVE);
    await saveHistory(collection, currentDoc, req.user?._id);

    // Restore from snapshot
    const restoreData = { ...snapshot.snapshot };
    restoreData.version = (currentDoc?.version || 0) + 1;
    restoreData.updatedAt = new Date();
    restoreData.updatedBy = req.user?._id || null;
    delete restoreData._id;

    const restored = await adapter.upsert(FILTER_ACTIVE, restoreData);

    res.status(200).json({
      success: true,
      message: `Rolled back ${collection} to version ${version}`,
      data: restored
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
    const history = await historyDb.findMany(
      { configCollection: collection },
      { sort: { savedAt: -1 }, limit: 20 }
    );

    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: `Error fetching history: ${error.message}` });
  }
};
