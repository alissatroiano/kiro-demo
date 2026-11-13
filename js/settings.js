(function (root) {
  'use strict';

  var Spooky = root.Spooky = root.Spooky || {};
  var core = Spooky.core;

  // Guarded access: merely reading window.localStorage can throw (blocked storage).
  function getStorage() {
    try {
      return root.localStorage || null;
    } catch (e) {
      return null;
    }
  }

  // Storage stand-in that makes core.loadSettings fall back to defaults.
  var NO_STORAGE = {
    getItem: function () { throw new Error('storage unavailable'); },
    setItem: function () { throw new Error('storage unavailable'); }
  };

  function prefersReducedMotion() {
    try {
      if (typeof root.matchMedia !== 'function') return false;
      var mql = root.matchMedia('(prefers-reduced-motion: reduce)');
      return !!(mql && mql.matches);
    } catch (e) {
      return false;
    }
  }

  // Sound is in memory only and off on every load (5.1).
  var soundOn = false;

  var settings = {
    getStorage: getStorage,
    prefersReducedMotion: prefersReducedMotion,

    // Returns { safeMode: boolean }; defaults from reduced motion when nothing valid is stored.
    load: function load() {
      return core.loadSettings(getStorage() || NO_STORAGE, prefersReducedMotion());
    },

    // Never throws.
    save: function save(value) {
      var storage = getStorage();
      if (!storage) return;
      core.saveSettings(storage, value);
    },

    getSound: function getSound() {
      return soundOn;
    },

    setSound: function setSound(value) {
      soundOn = value === true;
      return soundOn;
    },

    toggleSound: function toggleSound() {
      soundOn = core.toggleSound(soundOn);
      return soundOn;
    }
  };

  Spooky.settings = settings;
  if (typeof module !== 'undefined' && module.exports) module.exports = settings;
})(typeof window !== 'undefined' ? window : globalThis);
