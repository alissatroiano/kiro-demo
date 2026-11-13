(function (root) {
  'use strict';

  root.Spooky = root.Spooky || {};

  // createQuiz({ root, artworks, progress, gallery, controller, getSettings, core })
  //   root:        DOM root (document or element) containing #gallery, #quiz-panel,
  //                #win-screen, #live-region and the restart button(s)
  //   artworks:    manifest array (Path order)
  //   progress:    store with get(), set(progress), reset()
  //   gallery:     { update(status, opts) }  (re-renders card states)
  //   controller:  { requestScare(id, { source }) } (may be null)
  //   getSettings: () => { safeMode, reducedMotion }
  // Returns { openQuestion, showWin, restart, announce, refresh, destroy }.
  function createQuiz(deps) {
    var core = deps.core || root.Spooky.core;
    var scope = deps.root;
    var artworks = deps.artworks;
    var progress = deps.progress;
    var gallery = deps.gallery;
    var controller = deps.controller || null;
    var getSettings = deps.getSettings || function () { return {}; };

    var galleryEl = scope.querySelector('#gallery');
    var panel = scope.querySelector('#quiz-panel');
    var winScreen = scope.querySelector('#win-screen');
    var live = scope.querySelector('#live-region');
    var disposers = [];

    function listen(el, type, fn) {
      if (!el) return;
      el.addEventListener(type, fn);
      disposers.push(function () { el.removeEventListener(type, fn); });
    }

    function status() {
      return core.deriveStatus(artworks, progress.get());
    }

    function findArtwork(id) {
      for (var i = 0; i < artworks.length; i++) if (artworks[i].id === id) return artworks[i];
      return null;
    }

    function modeOpts() {
      var s = getSettings() || {};
      return { safeMode: s.safeMode === true, reducedMotion: s.reducedMotion === true };
    }

    function show(el) { if (el) el.removeAttribute('hidden'); }
    function hide(el) { if (el) el.setAttribute('hidden', ''); }

    // Clear then set in the same task so identical repeated messages are announced (11.8, 11.9).
    function announce(text) {
      if (!live) return;
      live.textContent = '';
      live.textContent = text;
    }

    function refresh() {
      gallery.update(status(), modeOpts());
    }

    function closePanel() {
      if (!panel) return;
      panel.innerHTML = '';
      hide(panel);
    }

    // Opens the question for the current artwork only (12.4).
    function openQuestion(id) {
      var st = status();
      if (!panel || st.escaped || id !== st.currentId) return false;
      var art = findArtwork(id);
      if (!art) return false;
      panel.innerHTML = core.renderQuizHTML(art);
      show(panel);
      var legend = panel.querySelector('legend');
      if (legend && typeof legend.focus === 'function') legend.focus();
      return true;
    }

    function showWin() {
      closePanel();
      show(winScreen);
      var h2 = winScreen && winScreen.querySelector('h2');
      if (h2 && typeof h2.focus === 'function') h2.focus();
    }

    function setFeedback(form, text, kind) {
      var fb = form.querySelector('.quiz-feedback');
      if (!fb) {
        fb = form.ownerDocument.createElement('p');
        fb.className = 'quiz-feedback';
        form.appendChild(fb);
      }
      var mode = core.quizFeedbackMode(modeOpts());
      fb.className = 'quiz-feedback feedback-' + kind + (mode.animated ? ' feedback-animated' : '');
      fb.textContent = text;
    }

    function focusAnswerControls(form) {
      var active = form.ownerDocument.activeElement;
      if (active && form.contains(active)) return;
      var target = form.querySelector('input[type="radio"]:checked') ||
        form.querySelector('input[type="radio"]') ||
        form.querySelector('button');
      if (target && typeof target.focus === 'function') target.focus();
    }

    function onSubmit(ev) {
      var form = ev.target;
      if (!form || !form.classList || !form.classList.contains('quiz-form')) return;
      ev.preventDefault();
      var id = form.getAttribute('data-id');
      var checked = form.querySelector('input[type="radio"]:checked');
      if (!checked) {
        focusAnswerControls(form);
        return;
      }
      var optionIndex = parseInt(checked.value, 10);
      var art = findArtwork(id);
      var out = core.submitAnswer(artworks, progress.get(), id, optionIndex);

      if (out.result === 'correct') {
        progress.set(out.progress);
        refresh();
        var text = core.announcementFor({ kind: 'correct', title: art ? art.title : '' });
        if (out.escaped) {
          announce(text + ' ' + core.announcementFor({ kind: 'escape' }));
          showWin();
        } else {
          var next = findArtwork(out.unlockedId);
          announce(text + ' ' + core.announcementFor({
            kind: 'unlock',
            nextTitle: next ? next.title : ''
          }));
          openQuestion(out.unlockedId);
        }
      } else if (out.result === 'incorrect') {
        var msg = core.announcementFor({ kind: 'incorrect' });
        announce(msg);
        setFeedback(form, msg, 'incorrect');
        focusAnswerControls(form);
        if (controller && typeof controller.requestScare === 'function') {
          controller.requestScare(id, { source: 'wrong-answer' });
        }
        focusAnswerControls(form);
      }
      // 'rejected': nothing visible.
    }

    function cardFromEvent(ev) {
      var el = ev.target;
      while (el && el !== galleryEl) {
        if (el.getAttribute && el.getAttribute('data-id')) return el;
        el = el.parentNode;
      }
      return null;
    }

    function onCardClick(ev) {
      var card = cardFromEvent(ev);
      if (card) openQuestion(card.getAttribute('data-id'));
    }

    function onCardKey(ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ' && ev.key !== 'Spacebar') return;
      var card = cardFromEvent(ev);
      // Only when the card itself has focus, not controls inside it.
      if (!card || ev.target !== card) return;
      ev.preventDefault(); // stop Space from scrolling
      openQuestion(card.getAttribute('data-id'));
    }

    // Restart: settings and sound are deliberately not touched (14.6, 14.7).
    function restart() {
      progress.reset();
      refresh();
      closePanel();
      hide(winScreen);
      announce(core.announcementFor({ kind: 'reset' }));
    }

    listen(galleryEl, 'click', onCardClick);
    listen(galleryEl, 'keydown', onCardKey);
    listen(panel, 'submit', onSubmit);
    var restartButtons = scope.querySelectorAll('#restart, #win-screen button');
    for (var i = 0; i < restartButtons.length; i++) listen(restartButtons[i], 'click', restart);

    return {
      openQuestion: openQuestion,
      showWin: showWin,
      restart: restart,
      announce: announce,
      refresh: refresh,
      destroy: function destroy() {
        disposers.forEach(function (d) { d(); });
        disposers = [];
      }
    };
  }

  root.Spooky.quiz = { createQuiz: createQuiz };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Spooky.quiz;
})(typeof window !== 'undefined' ? window : globalThis);
