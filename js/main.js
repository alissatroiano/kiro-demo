(function (root) {
  'use strict';

  var Spooky = root.Spooky = root.Spooky || {};
  var core = Spooky.core;
  var settings = Spooky.settings;
  var doc = root.document;

  var STING_FILES = [
    'assets/audio/sting-1.wav',
    'assets/audio/sting-2.wav',
    'assets/audio/sting-3.wav'
  ];

  function byId(id) { return doc.getElementById(id); }

  // Audio-based player: one preloaded Audio per sting, random pick per play.
  // play() may return a rejecting promise or throw; the controller ignores both (5.7).
  function createAudioPlayer(files) {
    var clips = [];
    try {
      files.forEach(function (f) {
        var a = new root.Audio(f);
        a.preload = 'auto';
        clips.push(a);
      });
    } catch (e) {
      clips = [];
    }
    return {
      play: function play() {
        if (!clips.length) return undefined;
        var clip = clips[Math.floor(Math.random() * clips.length)];
        try { clip.currentTime = 0; } catch (e) { /* ignore */ }
        return clip.play();
      }
    };
  }

  function showErrors(banner, errors) {
    if (!banner) return;
    banner.textContent = '';
    var p = doc.createElement('p');
    p.textContent = 'The gallery could not be built because the artwork data is invalid:';
    var ul = doc.createElement('ul');
    errors.forEach(function (msg) {
      var li = doc.createElement('li');
      li.textContent = msg;
      ul.appendChild(li);
    });
    banner.appendChild(p);
    banner.appendChild(ul);
    banner.removeAttribute('hidden');
  }

  function init() {
    var banner = byId('error-banner');
    var soundBtn = byId('sound-toggle');
    var safeBtn = byId('safe-toggle');
    var restartBtn = byId('restart');
    var liveRegion = byId('live-region');

    var artworks = Spooky.ARTWORKS;
    var validation = core.validateManifest(artworks);
    var valid = validation && validation.ok === true;

    var current = settings.load();
    var safeMode = current.safeMode === true;
    var quiz = null;

    function getSettings() {
      return { safeMode: safeMode, reducedMotion: settings.prefersReducedMotion() };
    }

    function syncToggles() {
      var soundOn = settings.getSound();
      if (soundBtn) {
        soundBtn.textContent = soundOn ? 'Sound: on' : 'Sound: off';
        soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      }
      if (safeBtn) {
        safeBtn.textContent = safeMode ? 'Safe mode: on' : 'Safe mode: off';
        safeBtn.setAttribute('aria-pressed', safeMode ? 'true' : 'false');
      }
    }

    // Controls that work whether or not the manifest is valid.
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        settings.toggleSound();
        syncToggles();
      });
    }
    if (safeBtn) {
      safeBtn.addEventListener('click', function () {
        safeMode = !safeMode;
        settings.save({ safeMode: safeMode });
        syncToggles();
        if (quiz) quiz.refresh();
      });
    }
    syncToggles();

    if (!valid) {
      showErrors(banner, (validation && validation.errors) || ['Artwork data is missing.']);
      // Restart still works: clear stored progress only (quiz.js is not built).
      if (restartBtn) {
        restartBtn.addEventListener('click', function () {
          var storage = settings.getStorage();
          if (storage) core.clearProgress(storage);
          if (liveRegion) {
            liveRegion.textContent = '';
            liveRegion.textContent = core.announcementFor({ kind: 'reset' });
          }
        });
      }
      return;
    }

    var storage = settings.getStorage() || {
      getItem: function () { throw new Error('storage unavailable'); },
      setItem: function () { throw new Error('storage unavailable'); },
      removeItem: function () { throw new Error('storage unavailable'); }
    };
    var progress = Spooky.createProgressStore(storage, artworks);

    function status() { return core.deriveStatus(artworks, progress.get()); }

    var gallery = Spooky.gallery.createGallery(byId('gallery'), artworks);
    gallery.render(status());
    gallery.update(status(), getSettings());

    var assignments = core.assignScares(artworks, Math.random);
    var altSrcs = {};
    artworks.forEach(function (a) { if (a.altSrc) altSrcs[a.id] = a.altSrc; });

    var controller = Spooky.createScareController({
      cards: gallery.getCards(),
      assignments: assignments,
      altSrcs: altSrcs,
      getStatus: status,
      getSettings: getSettings,
      getSound: settings.getSound,
      player: createAudioPlayer(STING_FILES)
    });

    quiz = Spooky.quiz.createQuiz({
      root: doc,
      artworks: artworks,
      progress: progress,
      gallery: gallery,
      controller: controller,
      getSettings: getSettings,
      core: core
    });

    // Already escaped: show the win screen without a scare or new announcement (14.2).
    if (status().escaped) quiz.showWin();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})(typeof window !== 'undefined' ? window : globalThis);
