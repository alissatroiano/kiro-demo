(function (root) {
  'use strict';

  root.Spooky = root.Spooky || {};
  var core = root.Spooky.core;
  var STATE_CLASSES = ['state-locked', 'state-unlocked', 'state-cleared', 'state-current'];

  // Replace a failed image with the title placeholder (9.1). Safe to call twice.
  function attachImageFallback(img, title) {
    if (!img || img.getAttribute('data-fallback') === '1') return;
    img.addEventListener('error', function onError() {
      if (!img.parentNode) return;
      img.setAttribute('data-fallback', '1');
      img.insertAdjacentHTML('afterend', core.renderPlaceholderHTML(title));
      img.parentNode.removeChild(img);
    });
  }

  // Creates a gallery bound to a container element (the #gallery list).
  // artworks: manifest array. Returns { render, update, getCards }.
  function createGallery(container, artworks) {
    var byId = {};
    artworks.forEach(function (a) { byId[a.id] = a; });

    function cardFor(id) {
      var cards = container.querySelectorAll('[data-id]');
      for (var i = 0; i < cards.length; i++) {
        if (cards[i].getAttribute('data-id') === id) return cards[i];
      }
      return null;
    }

    function getCards() {
      var map = {};
      var cards = container.querySelectorAll('[data-id]');
      for (var i = 0; i < cards.length; i++) map[cards[i].getAttribute('data-id')] = cards[i];
      return map;
    }

    // Full render of the grid from the manifest and derived status (1.1, 1.3, 1.6).
    function render(status) {
      var html = '';
      artworks.forEach(function (art) {
        html += core.renderCardHTML(art, status.states[art.id]);
      });
      container.innerHTML = html;
      artworks.forEach(function (art) {
        var card = cardFor(art.id);
        if (card) attachImageFallback(card.querySelector('img'), art.title);
      });
    }

    // Refresh card states in place so card elements (and any listeners) survive.
    // opts: { safeMode, reducedMotion }. Under either flag, no animation is used (15.6).
    function update(status, opts) {
      var mode = core.quizFeedbackMode(opts || {});
      container.classList.toggle('no-motion', !mode.animated);
      artworks.forEach(function (art) {
        var card = cardFor(art.id);
        if (!card) return;
        var state = status.states[art.id];
        var prev = card.getAttribute('data-state');
        if (prev === state) return;
        var info = core.cardStateInfo(state);
        STATE_CLASSES.forEach(function (c) { card.classList.remove(c); });
        card.classList.add('state-' + state);
        card.setAttribute('data-state', state);
        if (info.ariaDisabled) card.setAttribute('aria-disabled', 'true');
        else card.removeAttribute('aria-disabled');
        var label = card.querySelector('.sr-only');
        if (label) label.textContent = info.label;
        // Brief highlight only when motion is allowed (12.6).
        if (mode.animated && prev === 'locked') {
          card.classList.add('just-unlocked');
          setTimeout(function () { card.classList.remove('just-unlocked'); }, 600);
        } else {
          card.classList.remove('just-unlocked');
        }
      });
    }

    return { render: render, update: update, getCards: getCards };
  }

  root.Spooky.gallery = {
    createGallery: createGallery,
    attachImageFallback: attachImageFallback
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Spooky.gallery;
})(typeof window !== 'undefined' ? window : globalThis);
