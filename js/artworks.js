(function () {
  'use strict';
  var root = typeof window !== 'undefined' ? window : globalThis;
  root.Spooky = root.Spooky || {};

  function art(id, title, caption, alt, question, options, correctIndex) {
    return {
      id: id,
      title: title,
      caption: caption,
      alt: alt,
      src: 'assets/art/' + id + '.svg',
      altSrc: 'assets/art/alt/' + id + '.svg',
      question: question,
      options: options,
      correctIndex: correctIndex
    };
  }

  root.Spooky.ARTWORKS = [
    art('haunted-house', 'Haunted House', 'A crooked house on a lonely hill.',
      'A dark house with glowing windows on a hill.',
      'What do most haunted houses have in the window at night?',
      ['A glowing light', 'A flower box', 'A satellite dish'], 0),
    art('graveyard-gate', 'Graveyard Gate', 'The gate is never quite closed.',
      'An iron gate in front of old gravestones.',
      'What is found behind a graveyard gate?',
      ['Gravestones', 'A swimming pool', 'A bakery', 'A bus stop'], 0),
    art('black-cat', 'Black Cat', 'It has been watching you.',
      'A black cat with glowing eyes.',
      'What color are the cat\'s eyes glowing in the dark?',
      ['Pink', 'Yellow', 'Plaid'], 1),
    art('pumpkin-patch', 'Pumpkin Patch', 'Some of them are grinning.',
      'Carved pumpkins in a field.',
      'What do people carve pumpkins into?',
      ['Jack-o\'-lanterns', 'Sandwiches', 'Bicycles'], 0),
    art('candle-hall', 'Candle Hall', 'The candles light themselves.',
      'A long hallway lit by candles.',
      'What lights a hallway in this painting?',
      ['Candles', 'Neon signs', 'Fireworks', 'Headlights'], 0),
    art('foggy-lake', 'Foggy Lake', 'Something ripples beneath the mist.',
      'A still lake covered in fog.',
      'What covers the lake?',
      ['Fog', 'Ice cream', 'Carpet'], 0),
    art('crooked-tree', 'Crooked Tree', 'Its branches reach for you.',
      'A bare twisted tree against the moon.',
      'What does the tree have no leaves on?',
      ['Its branches', 'Its phone', 'Its shoes'], 0),
    art('bat-belfry', 'Bat Belfry', 'They only leave at dusk.',
      'Bats flying around a bell tower.',
      'Where do the bats live?',
      ['In a belfry', 'In a fridge', 'In a car wash'], 0),
    art('attic-mirror', 'Attic Mirror', 'Your reflection blinks late.',
      'An old mirror in a dusty attic.',
      'Where is the mirror kept?',
      ['The attic', 'The kitchen sink', 'A submarine'], 0),
    art('spider-cellar', 'Spider Cellar', 'Webs cover every shelf.',
      'A cellar full of cobwebs and a large spider.',
      'How many legs does a spider have?',
      ['Six', 'Eight', 'Ten', 'Twelve'], 1)
  ];
})();
