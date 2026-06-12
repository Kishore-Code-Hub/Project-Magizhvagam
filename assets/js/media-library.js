/**
 * MAGIZHVAGAM — Media Library UI
 * Upload, browse, search, select, and delete media assets.
 */
(function () {
  'use strict';

  let pickerCallback = null;
  let pickerModal = null;

  async function fetchMedia(params) {
    const qs = new URLSearchParams(params || {}).toString();
    const res = await adminFetch(`/api/media${qs ? '?' + qs : ''}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Failed to load media');
    return data;
  }

  async function uploadFile(file, alt) {
    const formData = new FormData();
    formData.append('image', file);
    if (alt) formData.append('alt', alt);
    const res = await adminFetch('/api/media/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.data;
  }

  function formatSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  let lightboxModal = null;

  function openLightbox(item) {
    if (lightboxModal) {
      lightboxModal.remove();
    }
    lightboxModal = document.createElement('div');
    lightboxModal.className = 'media-lightbox-modal';
    lightboxModal.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
    `;
    
    const formattedDate = item.createdAt ? new Date(item.createdAt).toLocaleString() : 'N/A';
    
    lightboxModal.innerHTML = `
      <div class="media-lightbox-content" style="
        position: relative;
        background: #171027;
        border: 1px solid #312744;
        border-radius: 12px;
        padding: 24px;
        max-width: 800px;
        width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        gap: 16px;
        color: #F5F0E8;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      ">
        <button type="button" class="media-lightbox-close" style="
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #B8B0C8;
          font-size: 24px;
          cursor: pointer;
        ">&times;</button>
        
        <div style="flex: 1; display: flex; justify-content: center; align-items: center; background: #0B0618; border-radius: 8px; overflow: hidden; max-height: 50vh;">
          <img src="${item.url}" alt="${item.originalName}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <h3 style="margin: 0; font-family: 'Cormorant Garamond', serif; font-size: 20px; color: #C9913D; word-break: break-all;">${item.originalName}</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; color: #B8B0C8; border-top: 1px solid #312744; padding-top: 12px;">
            <div><strong>Dimensions:</strong> ${item.width || '?'} &times; ${item.height || '?'} px</div>
            <div><strong>Size:</strong> ${formatSize(item.size)}</div>
            <div><strong>Uploaded On:</strong> ${formattedDate}</div>
            <div><strong>Mime Type:</strong> ${item.mimeType || 'image/webp'}</div>
          </div>
          <div style="display: flex; gap: 10px; margin-top: 12px;">
            <button type="button" class="studio-btn studio-btn-primary lightbox-copy-url" data-url="${item.url}" style="flex: 1; font-size: 12px; padding: 8px;">Copy Asset URL</button>
            <a href="${item.url}" target="_blank" class="studio-btn studio-btn-secondary" style="flex: 1; text-align: center; text-decoration: none; font-size: 12px; padding: 8px;">Open in New Tab</a>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(lightboxModal);
    
    lightboxModal.querySelector('.media-lightbox-close').addEventListener('click', () => {
      lightboxModal.remove();
      lightboxModal = null;
    });
    
    lightboxModal.querySelector('.lightbox-copy-url').addEventListener('click', () => {
      navigator.clipboard.writeText(item.url).then(() => {
        if (typeof showToast === 'function') showToast('URL copied to clipboard!', 'success');
      });
    });
  }

  function renderGrid(container, items, options) {
    const opts = options || {};
    if (!items.length) {
      container.innerHTML = '<p class="media-empty">No images found. Upload your first asset.</p>';
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="media-card${opts.selectMode ? ' selectable' : ''}" data-id="${item._id}" data-url="${item.url}">
        <div class="media-card-image">
          <img src="${item.url}" alt="${item.alt || item.originalName}" loading="lazy">
          ${opts.selectMode ? '<button type="button" class="media-select-btn">Select</button>' : ''}
          <div class="media-card-overlay">
            <span class="media-filename">${item.originalName}</span>
            <span class="media-meta">${item.width || '?'}×${item.height || '?'} · ${formatSize(item.size)}</span>
          </div>
        </div>
        <div class="media-card-actions">
          <button type="button" class="media-copy-url" data-url="${item.url}" title="Copy URL">Copy URL</button>
          ${!opts.selectMode ? `<button type="button" class="media-replace-btn" data-id="${item._id}">Replace</button>` : ''}
          ${!opts.selectMode ? `<button type="button" class="media-delete-btn" data-id="${item._id}">Delete</button>` : ''}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.media-copy-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(btn.dataset.url).then(() => {
          if (typeof showToast === 'function') showToast('URL copied', 'success');
        });
      });
    });

    if (!opts.selectMode) {
      container.querySelectorAll('.media-card-image').forEach(imgWrapper => {
        imgWrapper.style.cursor = 'pointer';
        imgWrapper.addEventListener('click', (e) => {
          const card = imgWrapper.closest('.media-card');
          const itemId = card.dataset.id;
          const item = items.find(i => i._id === itemId);
          if (item) {
            openLightbox(item);
          }
        });
      });

      container.querySelectorAll('.media-replace-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const assetId = btn.dataset.id;
          
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          fileInput.addEventListener('change', async (evt) => {
            const file = evt.target.files[0];
            if (!file) return;
            
            try {
              if (typeof showToast === 'function') showToast('Replacing image...', 'info');
              
              const formData = new FormData();
              formData.append('image', file);
              
              const res = await adminFetch(`/api/media/${assetId}`, {
                method: 'PUT',
                body: formData
              });
              const data = await res.json();
              if (data.success) {
                if (typeof showToast === 'function') showToast('Image replaced successfully', 'success');
                if (opts.onRefresh) opts.onRefresh();
              } else {
                if (typeof showToast === 'function') showToast(data.error || 'Replacement failed', 'error');
              }
            } catch (err) {
              if (typeof showToast === 'function') showToast(err.message, 'error');
            }
          });
          fileInput.click();
        });
      });

      container.querySelectorAll('.media-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm('Delete this image permanently?')) return;
          try {
            const res = await adminFetch(`/api/media/${btn.dataset.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
              if (typeof showToast === 'function') showToast('Image deleted', 'success');
              if (opts.onRefresh) opts.onRefresh();
            } else {
              if (typeof showToast === 'function') showToast(data.error || 'Delete failed', 'error');
            }
          } catch (err) {
            if (typeof showToast === 'function') showToast(err.message, 'error');
          }
        });
      });
    }

    if (opts.selectMode) {
      container.querySelectorAll('.media-card').forEach(card => {
        card.addEventListener('click', () => {
          if (pickerCallback) pickerCallback({ id: card.dataset.id, url: card.dataset.url });
          closePicker();
        });
      });
    }
  }

  function ensurePickerModal() {
    if (pickerModal) return pickerModal;
    pickerModal = document.createElement('div');
    pickerModal.id = 'media-picker-modal';
    pickerModal.className = 'media-picker-modal';
    pickerModal.innerHTML = `
      <div class="media-picker-backdrop"></div>
      <div class="media-picker-panel">
        <div class="media-picker-header">
          <h3>Select Image</h3>
          <button type="button" class="media-picker-close" aria-label="Close">&times;</button>
        </div>
        <div class="media-picker-toolbar">
          <input type="search" id="media-picker-search" placeholder="Search images..." class="studio-input">
          <label class="studio-btn studio-btn-primary media-upload-label">
            Upload
            <input type="file" id="media-picker-upload" accept="image/*" hidden>
          </label>
        </div>
        <div id="media-picker-grid" class="media-grid"></div>
      </div>
    `;
    document.body.appendChild(pickerModal);

    pickerModal.querySelector('.media-picker-close').addEventListener('click', closePicker);
    pickerModal.querySelector('.media-picker-backdrop').addEventListener('click', closePicker);

    pickerModal.querySelector('#media-picker-search').addEventListener('input', (e) => {
      loadPickerGrid(e.target.value);
    });

    pickerModal.querySelector('#media-picker-upload').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        if (typeof showToast === 'function') showToast('Uploading...', 'info');
        await uploadFile(file);
        if (typeof showToast === 'function') showToast('Uploaded', 'success');
        loadPickerGrid();
      } catch (err) {
        if (typeof showToast === 'function') showToast(err.message, 'error');
      } finally {
        e.target.value = '';
      }
    });

    return pickerModal;
  }

  async function loadPickerGrid(search) {
    const grid = document.getElementById('media-picker-grid');
    if (!grid) return;
    grid.innerHTML = '<p class="media-loading">Loading...</p>';
    try {
      const data = await fetchMedia(search ? { search } : {});
      renderGrid(grid, data.data, { selectMode: true });
    } catch (err) {
      grid.innerHTML = `<p class="media-error">${err.message}</p>`;
    }
  }

  function openPicker(callback) {
    pickerCallback = callback;
    ensurePickerModal();
    pickerModal.style.display = 'flex';
    loadPickerGrid();
  }

  function closePicker() {
    if (pickerModal) pickerModal.style.display = 'none';
    pickerCallback = null;
  }

  async function initMediaLibraryPage() {
    const grid = document.getElementById('media-library-grid');
    const searchInput = document.getElementById('media-library-search');
    const uploadInput = document.getElementById('media-library-upload');
    const dropZone = document.getElementById('media-drop-zone');
    if (!grid) return;

    async function refresh() {
      grid.innerHTML = '<p class="media-loading">Loading media library...</p>';
      try {
        const data = await fetchMedia(searchInput ? { search: searchInput.value } : {});
        renderGrid(grid, data.data, { onRefresh: refresh });
      } catch (err) {
        grid.innerHTML = `<p class="media-error">${err.message}</p>`;
      }
    }

    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(refresh, 300);
      });
    }

    async function handleFiles(files) {
      for (const file of files) {
        try {
          await uploadFile(file);
        } catch (err) {
          if (typeof showToast === 'function') showToast(err.message, 'error');
        }
      }
      if (typeof showToast === 'function') showToast('Upload complete', 'success');
      refresh();
    }

    if (uploadInput) {
      uploadInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFiles(e.target.files);
        e.target.value = '';
      });
    }

    if (dropZone) {
      ['dragenter', 'dragover'].forEach(ev => {
        dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      });
      ['dragleave', 'drop'].forEach(ev => {
        dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
      });
      dropZone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
      });
    }

    refresh();
  }

  window.MZMediaLibrary = {
    openPicker,
    closePicker,
    uploadFile,
    fetchMedia,
    initMediaLibraryPage
  };
})();
