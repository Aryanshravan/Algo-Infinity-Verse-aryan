// modules/bookmarkUI.js

import {
  ensureBookmarkCollectionsState,
  createCollection,
  renameCollection,
  deleteCollection,
  addProblemToCollections,
  getCollectionsForProblem,
  getCollectionStats,
  persistBookmarkCollections,
  loadBookmarkCollections,
  getBookmarkCollections,
  seedExampleBookmarkCollections,
} from './bookmarkCollections.js';
import { filterCollectionsByQuery, filterCollections } from './bookmarkFilters.js';
import { areKeyboardShortcutsEnabled } from './shortcut-guard.js';

// ============================================
// CONSTANTS
// ============================================

const DEBOUNCE_DELAY = 300;
const MAX_COLLECTION_NAME_LENGTH = 50;
const MIN_COLLECTION_NAME_LENGTH = 2;
const ITEMS_PER_PAGE = 20;

// ============================================
// STATE MANAGEMENT
// ============================================

let deleteHistory = [];
let currentPage = 1;
let totalPages = 1;
let searchDebounceTimer = null;
let isInitialized = false;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(value) {
  const text = String(value ?? '');
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show loading state
 */
function showLoading(container) {
  container.innerHTML = `
    <div class="bookmark-loading" role="status" aria-label="Loading collections">
      <div class="bookmark-loading-spinner"></div>
      <p>Loading collections...</p>
    </div>
  `;
}

/**
 * Hide loading state - no-op, kept for compatibility
 */
function hideLoading() {
  // Function kept for compatibility
}

/**
 * Show notification with error handling
 */
function showNotification(message, type = 'info') {
  try {
    if (typeof window.showNotification === 'function') {
      window.showNotification(message, type);
    } else {
      console.log(`[BookmarkUI] ${type}: ${message}`);
      if (type === 'error') {
        alert(message);
      }
    }
  } catch (error) {
    console.error('Failed to show notification:', error);
  }
}

/**
 * Debounce function for search/filter
 */
function debounce(func, delay = DEBOUNCE_DELAY) {
  return function (...args) {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Validate collection name
 */
function validateCollectionName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Collection name is required.' };
  }

  const trimmed = name.trim();
  if (trimmed.length < MIN_COLLECTION_NAME_LENGTH) {
    return {
      valid: false,
      error: `Collection name must be at least ${MIN_COLLECTION_NAME_LENGTH} characters.`,
    };
  }

  if (trimmed.length > MAX_COLLECTION_NAME_LENGTH) {
    return {
      valid: false,
      error: `Collection name cannot exceed ${MAX_COLLECTION_NAME_LENGTH} characters.`,
    };
  }

  return { valid: true, value: trimmed };
}

/**
 * Save user data helper
 */
function saveUserData() {
  if (typeof window.saveUserData === 'function') {
    window.saveUserData();
  }
}

/**
 * Get create form element
 */
function getCreateForm() {
  return document.getElementById('bookmarkCollectionCreateForm');
}

/**
 * Undo delete collection
 */
function undoDelete() {
  if (deleteHistory.length === 0) {
    showNotification('No deleted collections to restore.', 'info');
    return;
  }

  const lastDeleted = deleteHistory.pop();
  try {
    const userProgress = window.userProgress || {};
    ensureBookmarkCollectionsState(userProgress);

    const recreated = createCollection(userProgress, {
      name: lastDeleted.name,
      description: lastDeleted.description || '',
      icon: lastDeleted.icon || '📚',
      color: lastDeleted.color || '#6366f1',
    });

    if (recreated) {
      saveUserData();
      persistBookmarkCollections(userProgress);
      renderBookmarkCollectionsPanel();
      showNotification(`Restored collection: ${lastDeleted.name}`, 'success');
    }
  } catch (error) {
    console.error('Undo delete error:', error);
    showNotification('Failed to restore deleted collection.', 'error');
  }
}

// ============================================
// INITIALIZATION
// ============================================

function initBookmarkCollections() {
  try {
    if (isInitialized) return;
    isInitialized = true;

    const userProgress = window.userProgress || {};
    ensureBookmarkCollectionsState(userProgress);
    loadBookmarkCollections(userProgress);

    if (!getBookmarkCollections(userProgress).length) {
      seedExampleBookmarkCollections(userProgress);
      persistBookmarkCollections(userProgress);
    }

    renderBookmarkCollectionsPanel();
    attachBookmarkCollectionEvents();

    document.addEventListener('keydown', (event) => {
      // Undo via Ctrl/Cmd+Z is a desktop shortcut; skip it on mobile
      // viewports where a physical keyboard isn't available.
      if (!areKeyboardShortcutsEnabled()) return;
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        const activeElement = document.activeElement;
        if (
          activeElement &&
          activeElement.tagName !== 'INPUT' &&
          activeElement.tagName !== 'TEXTAREA'
        ) {
          undoDelete();
        }
      }
    });
  } catch (error) {
    console.error('Init bookmark collections error:', error);
    showNotification('Failed to initialize bookmark collections.', 'error');
  }
}

// ============================================
// EVENT ATTACHMENT
// ============================================

function attachBookmarkCollectionEvents() {
  try {
    const createForm = getCreateForm();
    if (createForm) {
      createForm.addEventListener('submit', (event) => {
        event.preventDefault();
        handleCreateCollection();
      });
    }

    const searchInput = document.getElementById('bookmarkCollectionSearch');
    if (searchInput) {
      const debouncedSearch = debounce(() => {
        currentPage = 1;
        renderBookmarkCollectionsPanel();
      });
      searchInput.addEventListener('input', debouncedSearch);
    }

    const topicFilter = document.getElementById('bookmarkCollectionTopicFilter');
    if (topicFilter) {
      topicFilter.addEventListener('change', () => {
        currentPage = 1;
        renderBookmarkCollectionsPanel();
      });
    }

    const solvedFilter = document.getElementById('bookmarkCollectionSolvedFilter');
    if (solvedFilter) {
      solvedFilter.addEventListener('change', () => {
        currentPage = 1;
        renderBookmarkCollectionsPanel();
      });
    }

    document.addEventListener('click', (event) => {
      handleRenameClick(event);
      handleDeleteClick(event);
      handleAddToCollectionClick(event);
      handlePaginationClick(event);
    });

    const undoButton = document.getElementById('bookmarkUndoDeleteBtn');
    if (undoButton) {
      undoButton.addEventListener('click', undoDelete);
    }
  } catch (error) {
    console.error('Attach events error:', error);
  }
}

// ============================================
// HANDLER FUNCTIONS
// ============================================

function handleCreateCollection() {
  try {
    const input = document.getElementById('bookmarkCollectionName');
    const description = document.getElementById('bookmarkCollectionDescription');
    const icon = document.getElementById('bookmarkCollectionIcon');
    const color = document.getElementById('bookmarkCollectionColor');

    if (!input || !window.userProgress) {
      showNotification('Missing required fields.', 'error');
      return;
    }

    const nameValidation = validateCollectionName(input.value);
    if (!nameValidation.valid) {
      showNotification(nameValidation.error, 'error');
      return;
    }

    const created = createCollection(window.userProgress, {
      name: nameValidation.value,
      description: description ? description.value.trim() : '',
      icon: icon ? icon.value.trim() || '📚' : '📚',
      color: color ? color.value : '#6366f1',
    });

    if (!created) {
      showNotification('Collection name must be unique.', 'error');
      return;
    }

    saveUserData();
    persistBookmarkCollections(window.userProgress);
    renderBookmarkCollectionsPanel();

    const form = getCreateForm();
    if (form) form.reset();

    showNotification(`Collection created: ${created.name}`, 'success');
  } catch (error) {
    console.error('Create collection error:', error);
    showNotification('Failed to create collection.', 'error');
  }
}

function handleRenameClick(event) {
  try {
    const renameButton = event.target.closest('.bookmark-rename-btn');
    if (!renameButton) return;

    const collectionId = renameButton.dataset.collectionId;
    const userProgress = window.userProgress || {};
    const collection = getBookmarkCollections(userProgress).find(
      (item) => item.id === collectionId
    );
    if (!collection) return;

    const nextName = window.prompt('Rename collection (2-50 characters)', collection.name);
    if (!nextName) return;

    const nameValidation = validateCollectionName(nextName);
    if (!nameValidation.valid) {
      showNotification(nameValidation.error, 'error');
      return;
    }

    renameCollection(userProgress, collectionId, nameValidation.value);
    saveUserData();
    persistBookmarkCollections(userProgress);
    renderBookmarkCollectionsPanel();
    showNotification(`Renamed to: ${nameValidation.value}`, 'success');
  } catch (error) {
    console.error('Rename error:', error);
    showNotification('Failed to rename collection.', 'error');
  }
}

function handleDeleteClick(event) {
  try {
    const deleteButton = event.target.closest('.bookmark-delete-btn');
    if (!deleteButton) return;

    const collectionId = deleteButton.dataset.collectionId;
    const userProgress = window.userProgress || {};
    const collection = getBookmarkCollections(userProgress).find(
      (item) => item.id === collectionId
    );
    if (!collection) return;

    if (!window.confirm(`Delete "${collection.name}"? Problems will remain in favorites.`)) return;

    deleteHistory.push({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      icon: collection.icon,
      color: collection.color,
    });

    deleteCollection(userProgress, collectionId);
    saveUserData();
    persistBookmarkCollections(userProgress);
    renderBookmarkCollectionsPanel();
    showNotification(`Deleted: ${collection.name} (Press Ctrl+Z to undo)`, 'warning');
  } catch (error) {
    console.error('Delete error:', error);
    showNotification('Failed to delete collection.', 'error');
  }
}

function handleAddToCollectionClick(event) {
  try {
    const addButton = event.target.closest('.bookmark-add-collection-btn');
    if (!addButton) return;

    const problemId = Number(addButton.dataset.problemId);
    const selectedCheckboxes = document.querySelectorAll('.bookmark-collection-choice:checked');
    const collectionIds = Array.from(selectedCheckboxes).map((item) => item.value);

    addProblemToCollections(window.userProgress, problemId, collectionIds);
    saveUserData();
    persistBookmarkCollections(window.userProgress);
    renderBookmarkCollectionsPanel();
    showNotification('Problem added to selected collections.', 'success');
  } catch (error) {
    console.error('Add to collection error:', error);
    showNotification('Failed to add to collections.', 'error');
  }
}

function handlePaginationClick(event) {
  const prevButton = event.target.closest('.bookmark-prev-page');
  const nextButton = event.target.closest('.bookmark-next-page');

  if (prevButton && currentPage > 1) {
    currentPage--;
    renderBookmarkCollectionsPanel();
  }

  if (nextButton && currentPage < totalPages) {
    currentPage++;
    renderBookmarkCollectionsPanel();
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderBookmarkCollectionsPanel() {
  const container = document.getElementById('bookmarkCollectionsPanel');
  if (!container) return;

  try {
    showLoading(container);

    const userProgress = window.userProgress || {};
    ensureBookmarkCollectionsState(userProgress);
    loadBookmarkCollections(userProgress);

    const searchInput = document.getElementById('bookmarkCollectionSearch');
    const topicFilter = document.getElementById('bookmarkCollectionTopicFilter');
    const solvedFilter = document.getElementById('bookmarkCollectionSolvedFilter');

    const searchQuery = searchInput ? searchInput.value : '';
    const filters = {
      topic: topicFilter ? topicFilter.value : '',
      solved: solvedFilter ? solvedFilter.checked : false,
      unsolved: false,
      recentlyAdded: false,
    };

    let collections = getBookmarkCollections(userProgress);
    collections = filterCollectionsByQuery(collections, searchQuery);
    collections = filterCollections(collections, filters);

    if (!collections.length) {
      hideLoading();
      container.innerHTML = `
        <div class="empty-state" role="status">
          <p>No bookmark collections found.</p>
          <p class="empty-state-hint">Create one to organize your problems.</p>
        </div>
      `;
      return;
    }

    const problemData = Array.isArray(window.practiceProblems) ? window.practiceProblems : [];
    // Get collection stats for progress tracking
    const collectionStats = getCollectionStats(userProgress, problemData);
    const statsData = collectionStats.collections || [];

    totalPages = Math.ceil(collections.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, collections.length);
    const paginatedCollections = collections.slice(startIndex, endIndex);

    let html = `<div class="bookmark-collections-grid" role="list">`;

    paginatedCollections.forEach((collection) => {
      // Find stats for this collection
      const collectionStat = statsData.find((s) => s.id === collection.id);
      const problemCount = collectionStat?.problemCount || collection.problemCount || 0;
      const completedCount = collectionStat?.completedCount || collection.completedCount || 0;
      const completionPercent =
        collectionStat?.completionPercent || collection.completionPercent || 0;

      html += `
        <article class="bookmark-collection-card" 
                 style="border-left: 6px solid ${collection.color || '#6366f1'};"
                 role="listitem">
          <div class="bookmark-collection-header">
            <div class="bookmark-collection-info">
              <span class="bookmark-collection-icon" aria-hidden="true">${collection.icon || '📚'}</span>
              <h3>${escapeHtml(collection.name)}</h3>
              <p>${escapeHtml(collection.description || 'Organized practice collection')}</p>
            </div>
            <div class="bookmark-collection-actions">
              <button type="button" 
                      class="bookmark-rename-btn" 
                      data-collection-id="${collection.id}" 
                      aria-label="Rename collection">
                ✏️
              </button>
              <button type="button" 
                      class="bookmark-delete-btn" 
                      data-collection-id="${collection.id}" 
                      aria-label="Delete collection">
                🗑️
              </button>
            </div>
          </div>
          <div class="bookmark-collection-metrics">
            <span>${problemCount} problems</span>
            <span>${completedCount} completed</span>
            <span>${completionPercent}% done</span>
          </div>
        </article>
      `;
    });

    html += `</div>`;

    if (totalPages > 1) {
      html += `
        <div class="bookmark-pagination" role="navigation" aria-label="Pagination">
          <button class="bookmark-prev-page" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Previous page">
            Previous
          </button>
          <span class="bookmark-page-info">Page ${currentPage} of ${totalPages}</span>
          <button class="bookmark-next-page" ${currentPage >= totalPages ? 'disabled' : ''} aria-label="Next page">
            Next
          </button>
        </div>
      `;
    }

    if (deleteHistory.length > 0) {
      html += `
        <div class="bookmark-undo-container">
          <button class="bookmark-undo-btn" id="bookmarkUndoDeleteBtn" aria-label="Undo last delete">
            ↩️ Undo Delete (${deleteHistory.length})
          </button>
        </div>
      `;
    }

    hideLoading();
    container.innerHTML = html;

    const undoBtn = document.getElementById('bookmarkUndoDeleteBtn');
    if (undoBtn) {
      undoBtn.addEventListener('click', undoDelete);
    }
  } catch (error) {
    console.error('Render error:', error);
    hideLoading();
    container.innerHTML = `
      <div class="bookmark-error" role="alert">
        <p>Failed to load bookmark collections.</p>
        <button class="bookmark-retry-btn" onclick="renderBookmarkCollectionsPanel()">Retry</button>
      </div>
    `;
  }
}

function renderCollectionChooser(problemId) {
  try {
    const userProgress = window.userProgress || {};
    ensureBookmarkCollectionsState(userProgress);
    loadBookmarkCollections(userProgress);

    const collections = getBookmarkCollections(userProgress);
    if (!collections.length) {
      return `
        <div class="bookmark-collection-picker-empty">
          <p>No collections available. Create one first!</p>
        </div>
      `;
    }

    const selected = getCollectionsForProblem(userProgress, problemId);

    return `
      <div class="bookmark-collection-picker" role="group" aria-label="Collection picker">
        <strong>Add to Collections</strong>
        <div class="bookmark-collection-choices" role="list">
          ${collections
            .map(
              (collection) => `
            <label class="bookmark-collection-choice-item" role="listitem">
              <input type="checkbox" 
                     class="bookmark-collection-choice" 
                     value="${collection.id}" 
                     ${selected.includes(collection.id) ? 'checked' : ''}
                     aria-label="Add to ${collection.name}">
              <span>${escapeHtml(collection.name)}</span>
            </label>
          `
            )
            .join('')}
        </div>
        <button type="button" 
                class="bookmark-add-collection-btn" 
                data-problem-id="${problemId}"
                aria-label="Save to selected collections">
          Save to collections
        </button>
      </div>
    `;
  } catch (error) {
    console.error('Render collection chooser error:', error);
    return `<div class="bookmark-error">Failed to load collections.</div>`;
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  initBookmarkCollections,
  renderBookmarkCollectionsPanel,
  renderCollectionChooser,
  undoDelete,
};
