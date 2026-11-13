(function (root) {
  'use strict';

  function getCore() {
    if (root.Spooky && root.Spooky.core) return root.Spooky.core;
    if (typeof require === 'function') return require('./core.js');
    throw new Error('Spooky.core must be loaded before progress.js');
  }

  // In-memory copy is the source of truth; storage is best effort (14.1 to 14.4, 14.7).
  function createProgressStore(storage, artworks) {
    var core = getCore();
    var progress;
    try {
      progress = core.loadProgress(storage, artworks);
    } catch (e) {
      progress = core.initialProgress();
    }

    return {
      get: function get() {
        return progress;
      },
      set: function set(next) {
        progress = next;
        try {
          core.saveProgress(storage, progress);
        } catch (e) {
          // Storage unavailable: progress stays in memory.
        }
      },
      reset: function reset() {
        progress = core.restartProgress();
        try {
          core.clearProgress(storage);
        } catch (e) {
          // Storage unavailable: memory is already reset.
        }
      }
    };
  }

  root.Spooky = root.Spooky || {};
  root.Spooky.createProgressStore = createProgressStore;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createProgressStore: createProgressStore };
  }
})(typeof window !== 'undefined' ? window : globalThis);
