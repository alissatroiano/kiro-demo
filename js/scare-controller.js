(function (root) {
  'use strict';

  var core = (root.Spooky && root.Spooky.core) ||
    (typeof require === 'function' ? require('./core.js') : null);

  // cards: array/Map/object of elements keyed by artwork id (dataset.id or data-id).
  function normalizeCards(cards) {
    var out = Object.create(null);
    function idOf(el) {
      if (el.dataset && el.dataset.id) return el.dataset.id;
      if (typeof el.getAttribute === 'function') return el.getAttribute('data-id');
      return null;
    }
    if (!cards) return out;
    if (typeof Map !== 'undefined' && cards instanceof Map) {
      cards.forEach(function (el, id) { out[id] = el; });
    } else if (typeof cards.length === 'number') {
      for (var i = 0; i < cards.length; i++) {
        var id = idOf(cards[i]);
        if (id) out[id] = cards[i];
      }
    } else {
      Object.keys(cards).forEach(function (id) { out[id] = cards[id]; });
    }
    return out;
  }

  function createScareController(opts) {
    opts = opts || {};
    var cardById = normalizeCards(opts.cards);
    var assignments = opts.assignments || new Map();
    var getStatus = opts.getStatus;
    var getSettings = opts.getSettings || function () { return {}; };
    var getSound = opts.getSound || function () { return false; };
    var player = opts.player;
    var now = opts.now || function () { return Date.now(); };
    var schedule = opts.setTimeout ||
      (typeof setTimeout === 'function' ? function (fn, ms) { return setTimeout(fn, ms); } : null);
    var cancel = opts.clearTimeout ||
      (typeof clearTimeout === 'function' ? function (h) { clearTimeout(h); } : function () {});
    var createImage = opts.createImage ||
      (typeof Image === 'function' ? function () { return new Image(); } : null);

    var scheduler = core.createScheduler();
    var limiter = core.createFlashLimiter();
    var altLoaded = Object.create(null);
    var listeners = [];
    var active = null;       // { id, restore, handle }
    var destroyed = false;

    function reducedMotion(settings) {
      if (settings && typeof settings.reducedMotion === 'boolean') return settings.reducedMotion;
      try {
        return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
      } catch (e) {
        return false;
      }
    }

    function imgOf(card) {
      return card && typeof card.querySelector === 'function' ? card.querySelector('img') : null;
    }

    function altSrcOf(card) {
      var img = imgOf(card);
      var fromData = card && card.dataset && card.dataset.altSrc;
      return fromData || (img && img.dataset && img.dataset.altSrc) || null;
    }

    // Preload alternates (9.2). altSrc comes from opts.altSrcs (id -> url) or data-alt-src.
    function preload(id) {
      altLoaded[id] = false;
      var src = (opts.altSrcs && opts.altSrcs[id]) || altSrcOf(cardById[id]);
      if (!src || !createImage) return;
      try {
        var im = createImage();
        im.onload = function () { altLoaded[id] = true; };
        im.onerror = function () { altLoaded[id] = false; };
        im.src = src;
      } catch (e) {
        altLoaded[id] = false;
      }
    }

    function altUrl(id) {
      return (opts.altSrcs && opts.altSrcs[id]) || altSrcOf(cardById[id]);
    }

    function applyEffect(id, effect) {
      var card = cardById[id];
      var img = imgOf(card);
      var classes = [];
      var originalSrc = null;
      var swapped = false;

      if (effect.kind === 'flash') classes.push('fx-flash');
      else if (effect.kind === 'shake') classes.push('fx-shake');
      else if (effect.kind === 'static-fallback') classes.push('fx-static');
      else if (effect.kind === 'swap-static') classes.push('fx-static');

      if ((effect.kind === 'swap' || effect.kind === 'swap-static') && img) {
        var alt = altUrl(id);
        if (alt) {
          originalSrc = img.src;
          if (typeof img.getAttribute === 'function') {
            var attr = img.getAttribute('src');
            if (attr != null) originalSrc = attr;
          }
          img.src = alt;
          swapped = true;
        }
      }
      if (card && card.classList) {
        classes.forEach(function (c) { card.classList.add(c); });
      }
      return function restore() {
        if (card && card.classList) {
          classes.forEach(function (c) { card.classList.remove(c); });
        }
        if (swapped && img) img.src = originalSrc;
      };
    }

    function playSting() {
      try {
        if (!player || typeof player.play !== 'function') return;
        var p = player.play();
        if (p && typeof p.then === 'function') {
          p.then(null, function () { /* ignored (5.7) */ });
        }
      } catch (e) {
        // ignored (5.7)
      }
    }

    // Single pipeline for hover, touch, and wrong-answer scares.
    function run(itemId, source) {
      if (destroyed) return false;
      var card = cardById[itemId];
      if (!card) return false;
      var t = now();
      if (!scheduler.tryStart(itemId, t)) return false;

      var finished = false;
      var restore = function () {};
      function finish() {
        if (finished) return;
        finished = true;
        try { restore(); } catch (e) { /* ignore */ }
        active = null;
        scheduler.end(itemId, now());
      }

      try {
        var settings = getSettings() || {};
        var safeMode = settings.safeMode === true;
        var reduced = reducedMotion(settings);
        var assigned = source === 'wrong-answer'
          ? core.wrongAnswerEffectType(assignments, itemId)
          : assignments.get(itemId);
        var calm = safeMode || reduced;
        var flashAllowed = assigned === 'flash' && !calm ? limiter.tryFlash(t) : false;
        var effect = core.resolveEffect({
          assigned: assigned,
          safeMode: safeMode,
          reducedMotion: reduced,
          altLoaded: altLoaded[itemId] === true,
          flashAllowed: flashAllowed
        });
        restore = applyEffect(itemId, effect);
        if (core.shouldPlayAudio({ soundOn: getSound() === true, safeMode: safeMode })) {
          playSting();
        }
        var handle = schedule ? schedule(finish, effect.durationMs) : null;
        active = { id: itemId, finish: finish, handle: handle };
        if (!schedule) finish();
      } catch (e) {
        finish();
        return false;
      }
      return true;
    }

    function tryScare(itemId, source) {
      var ok = core.canTriggerScare({
        status: getStatus(),
        itemId: itemId,
        assignments: assignments,
        source: source
      });
      if (!ok) return false;
      return run(itemId, source);
    }

    function listen(el, type, fn) {
      el.addEventListener(type, fn);
      listeners.push({ el: el, type: type, fn: fn });
    }

    function attach(id) {
      var card = cardById[id];
      var tracker = core.createGestureTracker();
      var longPressHandle = null;
      var touchActivated = false;

      function clearLongPress() {
        if (longPressHandle !== null && longPressHandle !== undefined) cancel(longPressHandle);
        longPressHandle = null;
      }

      // Mouse hover: gate first, then start synchronously (3.3).
      listen(card, 'pointerenter', function (ev) {
        if (!ev || ev.pointerType !== 'mouse') return;
        tryScare(id, 'hover');
      });

      listen(card, 'touchstart', function () {
        touchActivated = true;
        tracker.touchStart(now());
        clearLongPress();
        if (schedule) {
          longPressHandle = schedule(function () {
            longPressHandle = null;
            if (tracker.shouldFire('long-press')) tryScare(id, 'touch');
          }, core.LONG_PRESS_MS);
        }
      });

      listen(card, 'touchend', function () {
        clearLongPress();
        var kind = tracker.touchEnd(now());
        if (kind !== 'none' && tracker.shouldFire(kind)) tryScare(id, 'touch');
      });

      listen(card, 'touchcancel', function () {
        clearLongPress();
        tracker.touchEnd(now());
      });

      // Touch activations must never navigate (6.4).
      listen(card, 'click', function (ev) {
        if (touchActivated) {
          touchActivated = false;
          if (ev && typeof ev.preventDefault === 'function') ev.preventDefault();
        }
      });
    }

    // Only scare-item cards get handlers. No focus/focusin listeners (8.3).
    // The quiz panel and Win_Screen are never given handlers (13.5).
    Object.keys(cardById).forEach(function (id) {
      preload(id);
      if (assignments.has(id)) attach(id);
    });

    return {
      requestScare: function requestScare(itemId, o) {
        var source = o && o.source;
        if (source === 'wrong-answer') return tryScare(itemId, 'wrong-answer');
        if (source === 'hover' || source === 'touch') return tryScare(itemId, source);
        return false;
      },
      destroy: function destroy() {
        destroyed = true;
        listeners.forEach(function (l) {
          if (typeof l.el.removeEventListener === 'function') l.el.removeEventListener(l.type, l.fn);
        });
        listeners = [];
        if (active) {
          if (active.handle !== null && active.handle !== undefined) cancel(active.handle);
          active.finish();
        }
      }
    };
  }

  var api = { createScareController: createScareController };
  root.Spooky = root.Spooky || {};
  root.Spooky.createScareController = createScareController;
  root.Spooky.scareController = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
