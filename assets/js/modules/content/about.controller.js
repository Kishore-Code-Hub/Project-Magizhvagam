/**
 * About Controller — Content Workspace
 * Manages the corporate profile and brand story details.
 */
class AboutController extends BaseController {
  constructor() {
    super('about');
  }

  getTemplateUrl() {
    return '/admin/workspaces/content/about.html';
  }

  init() {
    const form = this.$('#about-page-form');
    if (form) {
      this.on(form, 'submit', (e) => this.save(e));
    }

    const pickBtn = this.$('#about-pick-image');
    if (pickBtn) {
      this.on(pickBtn, 'click', () => {
        _pickImage((asset) => {
          const field = this.$('#about-image-field');
          const preview = this.$('#about-image-preview');
          if (field) field.value = asset.url || '';
          if (preview) preview.innerHTML = `<img src="${asset.url}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
        });
      });
    }

    const clearBtn = this.$('#about-clear-image');
    if (clearBtn) {
      this.on(clearBtn, 'click', () => {
        const field = this.$('#about-image-field');
        const preview = this.$('#about-image-preview');
        if (field) field.value = '';
        if (preview) preview.innerHTML = `<span style="color:var(--text-muted); font-size:12px;">No image selected</span>`;
      });
    }
  }

  async load() {
    this.state.loading = true;
    try {
      const res = await adminFetch('/api/about-page');
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const fields = {
          'about-story-heading-field': d.storyHeading,
          'about-story-intro-field': d.storyIntro,
          'about-left-heading-field': d.leftHeading,
          'about-left-p1-field': d.leftParagraph1,
          'about-left-p2-field': d.leftParagraph2,
          'about-image-field': d.image
        };
        for (const [id, val] of Object.entries(fields)) {
          const el = this.$('#' + id);
          if (el) el.value = val || '';
        }
        if (d.image) {
          const preview = this.$('#about-image-preview');
          if (preview) preview.innerHTML = `<img src="${d.image}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;
        }
      }
    } catch (err) {
      console.warn('[AboutController] Failed loading about page details:', err);
    }
    this.state.loading = false;
  }

  validate() {
    const heading = this.$('#about-story-heading-field')?.value.trim();
    if (!heading) {
      showToast('Brand story heading is required', 'error');
      return false;
    }
    return true;
  }

  async save(e) {
    if (e) e.preventDefault();
    if (!this.validate()) return;

    this.state.loading = true;
    const payload = {
      storyHeading: this.$('#about-story-heading-field')?.value.trim(),
      storyIntro: this.$('#about-story-intro-field')?.value.trim(),
      leftHeading: this.$('#about-left-heading-field')?.value.trim(),
      leftParagraph1: this.$('#about-left-p1-field')?.value.trim(),
      leftParagraph2: this.$('#about-left-p2-field')?.value.trim(),
      image: this.$('#about-image-field')?.value.trim()
    };

    try {
      const res = await adminFetch('/api/about-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast('About Page details saved!', 'success');
        this.state.dirty = false;
      } else {
        showToast(data.error || 'Failed to save about content', 'error');
      }
    } catch (err) {
      showToast('Error syncing about details', 'error');
    }
    this.state.loading = false;
  }

  async reset() {
    if (!confirm('Discard unsaved changes on about details?')) return;
    await this.load();
  }

  destroy() {
    super.destroy();
  }
}
window.AboutController = AboutController;
