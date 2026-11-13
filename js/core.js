(function (root) {
  'use strict';

  var core = {};

  // ---- Constants ----
  core.EFFECT_TYPES = ['flash', 'shake', 'swap'];
  core.COOLDOWN_MS = 5000;
  core.MAX_EFFECT_MS = 2000;
  core.LONG_PRESS_MS = 500;
  core.SWAP_STATIC_MS = 1000;
  core.FLASH_PULSE_MS = 150;
  core.MAX_FLASHES_PER_SEC = 3;
  core.PROGRESS_VERSION = 1;
  core.SAFE_MODE_KEY = 'spookyGallery.safeMode';
  core.PROGRESS_KEY = 'spookyGallery.progress';

  // ---- Helpers ----
  function escapeHTML(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  core.escapeHTML = escapeHTML;

  // ---- Card state info (12.2, 12.5, 15.7) ----
  var STATE_LABELS = {
    locked: 'Locked',
    unlocked: 'Unlocked',
    cleared: 'Cleared',
    current: 'Current question'
  };

  core.cardStateInfo = function cardStateInfo(state) {
    return {
      state: state,
      label: STATE_LABELS[state] || '',
      ariaDisabled: state === 'locked',
      dimmed: state === 'locked'
    };
  };

  // ---- Rendering (1.3, 1.6, 3.2, 9.1, 12.2, 12.5, 15.7) ----
  // Identical for scare and non-scare items: no scare data is an input.
  core.renderCardHTML = function renderCardHTML(artwork, state) {
    var info = core.cardStateInfo(state);
    var id = escapeHTML(artwork.id);
    var descId = 'card-state-' + id;
    var attrs =
      ' class="card state-' + escapeHTML(state) + '"' +
      ' data-id="' + id + '"' +
      ' data-state="' + escapeHTML(state) + '"' +
      ' tabindex="0"' +
      ' aria-describedby="' + descId + '"';
    if (info.ariaDisabled) attrs += ' aria-disabled="true"';
    return '<li' + attrs + '>' +
      '<figure>' +
      '<img src="' + escapeHTML(artwork.src) + '" alt="' + escapeHTML(artwork.alt) + '">' +
      '<figcaption>' +
      '<strong class="card-title">' + escapeHTML(artwork.title) + '</strong>' +
      '<span class="card-caption">' + escapeHTML(artwork.caption) + '</span>' +
      '</figcaption>' +
      '</figure>' +
      '<span class="sr-only" id="' + descId + '">' + escapeHTML(info.label) + '</span>' +
      '</li>';
  };

  core.renderPlaceholderHTML = function renderPlaceholderHTML(title) {
    return '<div class="placeholder" role="img" aria-label="' + escapeHTML(title) + '">' +
      '<span class="placeholder-title">' + escapeHTML(title) + '</span></div>';
  };

  // ---- Scare assignment (3.1, 3.5) ----
  core.assignScares = function assignScares(artworks, rng) {
    var rand = typeof rng === 'function' ? rng : Math.random;
    var n = artworks.length;
    var assignments = new Map();
    if (n === 0) return assignments;
    var minK = Math.min(3, n);
    var k = minK + Math.floor(rand() * (n - minK + 1));
    if (k > n) k = n;
    if (k < minK) k = minK;

    var idx = [];
    for (var i = 0; i < n; i++) idx.push(i);
    for (var j = n - 1; j > 0; j--) {
      var r = Math.floor(rand() * (j + 1));
      if (r > j) r = j;
      var t = idx[j]; idx[j] = idx[r]; idx[r] = t;
    }

    for (var m = 0; m < k; m++) {
      var art = artworks[idx[m]];
      var types = art && art.altSrc
        ? core.EFFECT_TYPES
        : core.EFFECT_TYPES.filter(function (x) { return x !== 'swap'; });
      var p = Math.floor(rand() * types.length);
      if (p >= types.length) p = types.length - 1;
      assignments.set(art.id, types[p]);
    }
    return assignments;
  };

  // ---- Effect resolution (3.4, 3.6, 7.1, 7.3, 7.4, 9.2) ----
  var SHAKE_MS = 600;
  var SWAP_MS = 1500;

  function shakeEffect() {
    return { kind: 'shake', durationMs: SHAKE_MS, animated: true, flashing: false };
  }

  core.resolveEffect = function resolveEffect(opts) {
    opts = opts || {};
    // Safe mode / reduced motion: never animate or flash.
    if (opts.safeMode || opts.reducedMotion) {
      return {
        kind: opts.altLoaded ? 'swap-static' : 'static-fallback',
        durationMs: core.SWAP_STATIC_MS,
        animated: false,
        flashing: false
      };
    }
    var assigned = opts.assigned;
    if (assigned === 'swap') {
      if (!opts.altLoaded) return shakeEffect();
      return { kind: 'swap', durationMs: SWAP_MS, animated: false, flashing: false };
    }
    if (assigned === 'flash') {
      if (opts.flashAllowed) {
        return { kind: 'flash', durationMs: core.FLASH_PULSE_MS, animated: true, flashing: true };
      }
      return opts.altLoaded
        ? { kind: 'swap', durationMs: SWAP_MS, animated: false, flashing: false }
        : shakeEffect();
    }
    // 'shake' or any unknown value
    return shakeEffect();
  };

  // ---- Audio helpers (5.3 to 5.6, 7.3) ----
  core.shouldPlayAudio = function shouldPlayAudio(opts) {
    opts = opts || {};
    return opts.soundOn === true && opts.safeMode !== true;
  };

  core.toggleSound = function toggleSound(soundOn) {
    return !soundOn;
  };

  // ---- Flash limiter (7.7): at most 3 grants per 1000 ms window ----
  core.createFlashLimiter = function createFlashLimiter() {
    var grantedAt = [];
    return {
      tryFlash: function tryFlash(nowMs) {
        grantedAt = grantedAt.filter(function (t) { return nowMs - t < 1000; });
        if (grantedAt.length < core.MAX_FLASHES_PER_SEC) {
          grantedAt.push(nowMs);
          return true;
        }
        return false;
      }
    };
  };

  // ---- Scheduler (4.1 to 4.4): global exclusivity plus per-item cooldown ----
  core.createScheduler = function createScheduler() {
    var runningId = null;
    var cooldownUntil = Object.create(null);
    return {
      tryStart: function tryStart(itemId, nowMs) {
        if (runningId !== null) return false;
        var until = cooldownUntil[itemId] || 0;
        if (nowMs < until) return false;
        runningId = itemId;
        return true;
      },
      end: function end(itemId, nowMs) {
        if (runningId !== null && runningId === itemId) {
          runningId = null;
          cooldownUntil[itemId] = nowMs + core.COOLDOWN_MS;
        }
      },
      isRunning: function isRunning() {
        return runningId !== null;
      },
      cooldownRemaining: function cooldownRemaining(itemId, nowMs) {
        var until = cooldownUntil[itemId] || 0;
        return Math.max(0, until - nowMs);
      }
    };
  };

  // ---- Gesture tracker (6.1 to 6.3): one trigger per gesture ----
  core.createGestureTracker = function createGestureTracker() {
    var startedAt = null;   // set while a finger is down
    var inGesture = false;  // true from touchStart until the next touchStart
    var fired = false;
    return {
      touchStart: function touchStart(nowMs) {
        startedAt = nowMs;
        inGesture = true;
        fired = false;
      },
      touchEnd: function touchEnd(nowMs) {
        if (startedAt === null) return 'none';
        var held = nowMs - startedAt;
        startedAt = null;
        return held >= core.LONG_PRESS_MS ? 'long-press' : 'tap';
      },
      shouldFire: function shouldFire(kind) {
        if (!inGesture || fired) return false;
        if (kind !== 'tap' && kind !== 'long-press') return false;
        fired = true;
        return true;
      }
    };
  };

  // ---- Settings (7.5, 7.6, 9.3) ----
  // `stored` is the raw storage value; only "true" and "false" are valid.
  // Anything else (null, undefined, other strings, non-strings) counts as absent.
  core.defaultSafeMode = function defaultSafeMode(opts) {
    opts = opts || {};
    if (opts.stored === 'true') return true;
    if (opts.stored === 'false') return false;
    return opts.reducedMotion === true;
  };

  core.loadSettings = function loadSettings(storage, reducedMotion) {
    var stored = null;
    try {
      stored = storage.getItem(core.SAFE_MODE_KEY);
    } catch (e) {
      stored = null;
    }
    return { safeMode: core.defaultSafeMode({ stored: stored, reducedMotion: reducedMotion === true }) };
  };

  core.saveSettings = function saveSettings(storage, settings) {
    try {
      storage.setItem(core.SAFE_MODE_KEY, settings && settings.safeMode === true ? 'true' : 'false');
    } catch (e) {
      // Storage unavailable: keep working in memory.
    }
  };

  // ---- Manifest validation (9.4, 10.1, 10.2) ----
  function nonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
  }

  core.validateManifest = function validateManifest(artworks) {
    var errors = [];
    if (!Array.isArray(artworks)) {
      return { ok: false, errors: ['manifest: must be an array of artworks'] };
    }
    if (artworks.length < 8 || artworks.length > 12) {
      errors.push('manifest: must contain 8 to 12 artworks, found ' + artworks.length);
    }
    var seen = Object.create(null);
    artworks.forEach(function (art, i) {
      if (art === null || typeof art !== 'object') {
        errors.push('artwork[' + i + ']: must be an object');
        return;
      }
      var label = nonEmptyString(art.id) ? 'artwork "' + art.id + '"' : 'artwork[' + i + ']';
      if (!nonEmptyString(art.id)) {
        errors.push(label + ': field "id" must be a non-empty string');
      } else if (seen[art.id]) {
        errors.push(label + ': field "id" is duplicated');
      } else {
        seen[art.id] = true;
      }
      ['title', 'caption', 'alt', 'src', 'question'].forEach(function (f) {
        if (!nonEmptyString(art[f])) {
          errors.push(label + ': field "' + f + '" must be a non-empty string');
        }
      });
      var opts = art.options;
      var optsOk = Array.isArray(opts);
      if (!optsOk || opts.length < 3 || opts.length > 4) {
        errors.push(label + ': field "options" must be an array of 3 or 4 entries');
        optsOk = false;
      } else {
        opts.forEach(function (o, j) {
          if (!nonEmptyString(o)) {
            errors.push(label + ': field "options[' + j + ']" must be a non-empty string');
          }
        });
      }
      var ci = art.correctIndex;
      if (typeof ci !== 'number' || !isFinite(ci) || Math.floor(ci) !== ci) {
        errors.push(label + ': field "correctIndex" must be an integer');
      } else if (!Array.isArray(opts) || ci < 0 || ci >= opts.length) {
        errors.push(label + ': field "correctIndex" is out of range');
      }
    });
    return { ok: errors.length === 0, errors: errors };
  };

  // ---- Quiz logic (10.3, 11.1, 11.2) ----
  core.checkAnswer = function checkAnswer(artwork, optionIndex) {
    return !!artwork && optionIndex === artwork.correctIndex;
  };

  // ---- Quiz markup (15.1, 15.2) ----
  // Nothing in the output reveals which option is correct.
  core.renderQuizHTML = function renderQuizHTML(artwork) {
    var id = escapeHTML(artwork.id);
    var name = 'quiz-' + id;
    var html = '<form class="quiz-form" data-id="' + id + '">' +
      '<fieldset>' +
      '<legend tabindex="-1">' + escapeHTML(artwork.question) + '</legend>';
    (artwork.options || []).forEach(function (opt, i) {
      var inputId = name + '-opt-' + i;
      html += '<div class="quiz-option">' +
        '<input type="radio" name="' + name + '" id="' + inputId + '" value="' + i + '">' +
        '<label for="' + inputId + '">' + escapeHTML(opt) + '</label>' +
        '</div>';
    });
    html += '<button type="submit">Submit answer</button>' +
      '</fieldset></form>';
    return html;
  };

  // ---- Game state (11.6, 11.7, 12.1 to 12.6, 13.1, 14.6) ----
  // Progress = { cleared: string[] }, always a prefix of the Path (manifest order).
  // No attempt counter, lives, or game-over state exists anywhere.
  core.initialProgress = function initialProgress() {
    return { cleared: [] };
  };

  core.restartProgress = function restartProgress() {
    return { cleared: [] };
  };

  core.deriveStatus = function deriveStatus(artworks, progress) {
    var list = Array.isArray(artworks) ? artworks : [];
    var cleared = progress && Array.isArray(progress.cleared) ? progress.cleared : [];
    var n = Math.min(cleared.length, list.length);
    var states = {};
    var currentId = null;
    for (var i = 0; i < list.length; i++) {
      var id = list[i].id;
      if (i < n) {
        states[id] = 'cleared';
      } else if (i === n) {
        states[id] = 'current';
        currentId = id;
      } else {
        states[id] = 'locked';
      }
    }
    return { states: states, currentId: currentId, escaped: list.length > 0 && n === list.length };
  };

  core.submitAnswer = function submitAnswer(artworks, progress, artworkId, optionIndex) {
    var status = core.deriveStatus(artworks, progress);
    if (status.currentId === null || artworkId !== status.currentId) {
      return { result: 'rejected', progress: progress, unlockedId: null, escaped: status.escaped };
    }
    var idx = artworks.findIndex(function (a) { return a.id === artworkId; });
    if (!core.checkAnswer(artworks[idx], optionIndex)) {
      return { result: 'incorrect', progress: progress, unlockedId: null, escaped: false };
    }
    var next = { cleared: progress.cleared.concat([artworkId]) };
    var after = idx + 1 < artworks.length ? artworks[idx + 1].id : null;
    return { result: 'correct', progress: next, unlockedId: after, escaped: after === null };
  };

  // ---- Progress persistence (14.1 to 14.4) ----
  core.serializeProgress = function serializeProgress(progress) {
    var cleared = progress && Array.isArray(progress.cleared) ? progress.cleared : [];
    return JSON.stringify({ v: core.PROGRESS_VERSION, cleared: cleared });
  };

  core.parseProgress = function parseProgress(text, artworks) {
    if (typeof text !== 'string' || !Array.isArray(artworks)) return null;
    var data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return null;
    }
    if (data === null || typeof data !== 'object' || Array.isArray(data)) return null;
    if (data.v !== core.PROGRESS_VERSION) return null;
    var cleared = data.cleared;
    if (!Array.isArray(cleared) || cleared.length > artworks.length) return null;
    var seen = Object.create(null);
    for (var i = 0; i < cleared.length; i++) {
      var id = cleared[i];
      if (typeof id !== 'string' || seen[id]) return null;
      seen[id] = true;
      // Must equal the first n ids of the Path in order (covers unknown ids and non-prefixes).
      if (!artworks[i] || artworks[i].id !== id) return null;
    }
    return { cleared: cleared.slice() };
  };

  core.clearProgress = function clearProgress(storage) {
    try {
      storage.removeItem(core.PROGRESS_KEY);
    } catch (e) {
      // Storage unavailable: nothing to clear.
    }
  };

  core.loadProgress = function loadProgress(storage, artworks) {
    var text = null;
    try {
      text = storage.getItem(core.PROGRESS_KEY);
    } catch (e) {
      return core.initialProgress();
    }
    if (text === null || text === undefined) return core.initialProgress();
    var parsed = core.parseProgress(text, artworks);
    if (parsed === null) {
      core.clearProgress(storage);
      return core.initialProgress();
    }
    return parsed;
  };

  core.saveProgress = function saveProgress(storage, progress) {
    try {
      storage.setItem(core.PROGRESS_KEY, core.serializeProgress(progress));
    } catch (e) {
      // Storage unavailable: progress stays in memory.
    }
  };

  // ---- Scare gating (3.3, 6.1, 11.3, 11.4, 12.3, 12.7, 13.5) ----
  // hover/touch: only Scare_Items that are not locked (cleared stays active).
  // wrong-answer: only the current artwork, scare item or not.
  core.canTriggerScare = function canTriggerScare(opts) {
    opts = opts || {};
    var status = opts.status;
    var itemId = opts.itemId;
    if (!status || !status.states || itemId === null || itemId === undefined) return false;
    if (opts.source === 'wrong-answer') {
      return status.currentId !== null && status.currentId !== undefined && itemId === status.currentId;
    }
    if (opts.source !== 'hover' && opts.source !== 'touch') return false;
    var assignments = opts.assignments;
    if (!assignments || typeof assignments.has !== 'function' || !assignments.has(itemId)) return false;
    var state = Object.prototype.hasOwnProperty.call(status.states, itemId) ? status.states[itemId] : undefined;
    return state !== undefined && state !== 'locked';
  };

  core.wrongAnswerEffectType = function wrongAnswerEffectType(assignments, itemId) {
    if (assignments && typeof assignments.get === 'function' && assignments.has(itemId)) {
      return assignments.get(itemId);
    }
    return 'shake';
  };

  // ---- Announcements (11.8, 11.9, 12.6, 13.3, 14.6) ----
  core.announcementFor = function announcementFor(opts) {
    opts = opts || {};
    var title = opts.title == null ? '' : String(opts.title);
    var nextTitle = opts.nextTitle == null ? '' : String(opts.nextTitle);
    switch (opts.kind) {
      case 'correct':
        return 'Correct. ' + title + ' cleared.';
      case 'incorrect':
        return 'Incorrect, try again';
      case 'unlock':
        return 'Unlocked: ' + nextTitle + '. Its question is next.';
      case 'escape':
        return 'You escaped the gallery. All artworks are cleared.';
      case 'reset':
        return 'Progress reset. The gallery is locked again, starting from the first artwork.';
      default:
        return 'Gallery updated.';
    }
  };

  // ---- Quiz feedback motion (15.6) ----
  core.quizFeedbackMode = function quizFeedbackMode(opts) {
    opts = opts || {};
    var calm = opts.safeMode === true || opts.reducedMotion === true;
    return { animated: !calm, flashing: false };
  };

  root.Spooky = root.Spooky || {};
  root.Spooky.core = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(typeof window !== 'undefined' ? window : globalThis);
