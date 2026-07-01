/**
 * CSS Controller — Appearance Studio Workspace
 * Manages raw styling overrides, validation checks, and theme export/imports.
 */
class CssController extends BaseController {
  constructor() {
    super('css');
  }

  getTemplateUrl() {
    return '/admin/workspaces/appearance/css.html';
  }

  init() {
    const editor = this.$('#custom-css-field');
    const status = this.$('#css-validation-status');

    if (editor) {
      this.on(editor, 'input', (e) => {
        const val = e.target.value;
        const valid = this._validateCssSyntax(val);
        
        if (status) {
          status.textContent = valid ? '✓ Syntax Valid' : '✗ Unbalanced Brackets or Invalid Syntax';
          status.style.color = valid ? 'var(--studio-success)' : '#ef4444';
        }
        
        this._updateLocal('customCss', val);
      });
    }

    // Export JSON trigger
    const exportBtn = this.$('#developer-export-btn');
    if (exportBtn) {
      this.on(exportBtn, 'click', () => {
        this._exportThemeJson();
      });
    }

    // Import JSON triggers
    const importBtn = this.$('#developer-import-btn');
    const importFile = this.$('#developer-import-file');
    if (importBtn && importFile) {
      this.on(importBtn, 'click', () => {
        importFile.click();
      });
      this.on(importFile, 'change', (e) => {
        this._importThemeJson(e);
      });
    }

    // Factory Reset trigger
    const resetBtn = this.$('#developer-reset-btn');
    if (resetBtn) {
      this.on(resetBtn, 'click', () => {
        this.reset();
      });
    }
  }

  async load() {
    this.state.loading = true;
    const theme = await window.MZThemeStore.load();
    if (theme) {
      this._populateForm(theme);
    }
    
    this.unsubscribe = window.MZThemeStore.subscribe((state) => {
      this._populateForm(state);
    });
    this.state.loading = false;
  }

  validate() {
    const editor = this.$('#custom-css-field');
    if (editor) {
      const val = editor.value;
      if (!this._validateCssSyntax(val)) {
        showToast('CSS contains unbalanced braces or syntax errors', 'error');
        return false;
      }
    }
    return true;
  }

  async save() {
    if (!this.validate()) return;
    const success = await window.MZThemeStore.save();
    if (success) {
      showToast('Custom CSS adjustments saved!', 'success');
      
      const iframe = document.getElementById('viewport-iframe');
      if (iframe) iframe.contentWindow.location.reload();
    } else {
      showToast('Failed to save Custom CSS', 'error');
    }
  }

  async reset() {
    if (!confirm('Warning: This will reset the entire storefront visual customization settings to defaults. Are you sure?')) return;
    this.state.loading = true;
    const success = await window.MZThemeStore.reset();
    if (success) {
      showToast('Theme values restored to defaults!', 'success');
    } else {
      showToast('Reset failed', 'error');
    }
    this.state.loading = false;
  }

  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    super.destroy();
  }

  _validateCssSyntax(css) {
    if (!css.trim()) return true;
    let braces = 0;
    for (let char of css) {
      if (char === '{') braces++;
      else if (char === '}') {
        braces--;
        if (braces < 0) return false;
      }
    }
    return braces === 0;
  }

  _populateForm(payload) {
    const editor = this.$('#custom-css-field');
    const status = this.$('#css-validation-status');
    const val = payload.customCss || '';
    if (editor) editor.value = val;
    if (status) {
      const valid = this._validateCssSyntax(val);
      status.textContent = valid ? '✓ Syntax Valid' : '✗ Unbalanced Brackets or Invalid Syntax';
      status.style.color = valid ? 'var(--studio-success)' : '#ef4444';
    }
  }

  _updateLocal(key, val) {
    window.MZThemeStore.update((state) => {
      state.customCss = val;
    });
  }

  _exportThemeJson() {
    const payload = window.MZThemeStore.get();
    if (!payload) {
      showToast('No active theme payload to export', 'error');
      return;
    }

    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `magizhvagam-theme-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Theme backup JSON file exported successfully!', 'success');
    } catch (err) {
      showToast('Error compiling theme export document', 'error');
    }
  }

  _importThemeJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        // Basic check for structural validity
        if (!imported.theme || !imported.layout) {
          showToast('Invalid theme backup document format', 'error');
          return;
        }

        window.MZThemeStore.update((state) => {
          Object.assign(state, imported);
        });
        showToast('Backup profile loaded successfully! Click Save to apply.', 'success');
      } catch (err) {
        showToast('Failed to parse styling backup document', 'error');
      }
    };
    reader.readAsText(file);
  }
}
window.CssController = CssController;
