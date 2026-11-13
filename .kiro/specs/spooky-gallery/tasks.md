# Implementation Plan: Spooky Gallery

## Overview

Implementation language: JavaScript (plain HTML, CSS, and classic `<script defer>` files, no build step, works from `file://`). Pure logic goes into `js/core.js` first, with property tests using `node:test` and `fast-check`. The core covers both the scare pipeline and the escape quiz game (manifest validation, answer checking, derived path status, progress persistence, gating, announcements). DOM wiring follows (settings, progress store, gallery, scare controller, quiz, bootstrap), then the page shell and styles.

## Tasks

- [x] 1. Project scaffolding and assets
  - [x] 1.1 Create project structure and test tooling
    - Create `package.json` (dev-only, `"test": "node --test tests/"`) and install `fast-check@3` as a pinned dev dependency
    - Create `js/core.js` with the UMD-style wrapper exporting an empty `core` object to `window.Spooky.core` and `module.exports`
    - Create the `tests/`, `css/`, `js/`, `assets/art/`, `assets/art/alt/`, and `assets/audio/` directories
    - _Requirements: 2.1, 2.3_

  - [x] 1.2 Create bundled artwork, audio, and manifest with quiz questions
    - Create 8 to 12 placeholder SVGs in `assets/art/` and matching creepy alternates in `assets/art/alt/`
    - Create short `.wav` stings (2 seconds or less) in `assets/audio/`
    - Create `js/artworks.js` setting `window.Spooky.ARTWORKS` in Path order with id, title, caption, alt, src, altSrc, and the question fields `question`, `options` (3 or 4 strings), and `correctIndex` (exactly one question per artwork, no `scare` field)
    - Use only relative paths, no external URLs
    - _Requirements: 1.1, 1.2, 1.3, 1.6, 2.1, 5.5, 10.1, 10.2, 10.4_

- [x] 2. Implement pure core logic: gallery and scare pipeline
  - [x] 2.1 Implement rendering helpers, card state info, and scare assignment in `js/core.js`
    - Add constants (`EFFECT_TYPES`, `COOLDOWN_MS`, `MAX_EFFECT_MS`, `LONG_PRESS_MS`, `PROGRESS_VERSION`, and so on)
    - Implement `cardStateInfo(state)` returning label ("Locked", "Unlocked", "Cleared", "Current question"), `ariaDisabled`, and `dimmed`
    - Implement `renderCardHTML(artwork, state)` with HTML escaping, `data-state`, `state-<state>` class, a `sr-only` state label referenced by `aria-describedby`, `aria-disabled` for locked cards, `tabindex="0"` on every card, and identical markup for scare and non-scare items
    - Implement `renderPlaceholderHTML(title)` with escaped title
    - Implement `assignScares(artworks, rng)` with 3 <= k <= n, one type per item, no `swap` without `altSrc`
    - _Requirements: 1.3, 1.6, 3.1, 3.2, 3.5, 9.1, 12.2, 12.5, 15.7_

  - [ ]* 2.2 Write property tests for rendering helpers and card state
    - `tests/render.property.test.js`
    - **Property 1: Card rendering includes title, caption, and alt text**
    - **Property 2: Scare items are visually indistinguishable**
    - **Property 14: Placeholder shows the artwork title**
    - **Property 31: Card state is exposed in text, not only visually**
    - **Validates: Requirements 1.3, 1.6, 3.2, 9.1, 12.2, 12.5, 15.7**

  - [ ]* 2.3 Write property test for scare assignment
    - `tests/assign.property.test.js`
    - **Property 3: Scare assignment is valid**
    - **Validates: Requirements 3.1, 3.5**

  - [x] 2.4 Implement effect resolution and audio helpers in `js/core.js`
    - Implement `resolveEffect({ assigned, safeMode, reducedMotion, altLoaded, flashAllowed })` following the design rules
    - Implement `shouldPlayAudio({ soundOn, safeMode })` and `toggleSound(soundOn)`
    - _Requirements: 3.4, 3.6, 5.3, 5.4, 5.5, 5.6, 7.1, 7.3, 7.4, 9.2_

  - [ ]* 2.5 Write property test for effect resolution
    - `tests/effect.property.test.js`
    - **Property 4: Effect resolution is always visible, bounded, and safe**
    - **Validates: Requirements 3.4, 3.6, 7.1, 7.3, 7.4, 9.2**

  - [ ]* 2.6 Write property tests for audio permission and sound toggle
    - `tests/audio.property.test.js`
    - **Property 6: Audio plays only when sound is on and safe mode is off**
    - **Property 7: Sound toggle is an involution**
    - **Validates: Requirements 5.3, 5.4, 5.5, 5.6, 7.3, 11.3**

  - [x] 2.7 Implement flash limiter, scheduler, and gesture tracker in `js/core.js`
    - `createFlashLimiter()` with at most 3 grants per 1000 ms window
    - `createScheduler()` with `tryStart`, `end`, `isRunning`, `cooldownRemaining` (5000 ms cooldown, global exclusivity)
    - `createGestureTracker()` with `touchStart`, `touchEnd`, `shouldFire` (tap under 500 ms, long-press at 500 ms, one trigger per gesture)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3, 7.7_

  - [ ]* 2.8 Write property test for flash limiter
    - `tests/flash-limiter.property.test.js`
    - **Property 9: Flash limiter caps flashes per second**
    - **Validates: Requirements 7.7**

  - [ ]* 2.9 Write property test for scheduler
    - `tests/scheduler.property.test.js`, compare against a reference model
    - **Property 5: Scheduler enforces exclusivity and cooldown**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 2.10 Write property test for gesture tracker
    - `tests/gesture.property.test.js`
    - **Property 13: One gesture yields at most one trigger**
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [x] 2.11 Implement settings helpers in `js/core.js`
    - `defaultSafeMode({ stored, reducedMotion })`, `loadSettings(storage, reducedMotion)`, `saveSettings(storage, settings)`
    - Use key `spookyGallery.safeMode`, treat invalid values as absent, wrap storage access in try/catch
    - _Requirements: 7.5, 7.6, 9.3_

  - [ ]* 2.12 Write property tests for settings
    - `tests/settings.property.test.js`
    - **Property 10: Safe mode setting round-trips through storage**
    - **Property 11: Default safe mode follows reduced motion when nothing is stored**
    - **Property 12: Storage failures fall back to defaults**
    - **Validates: Requirements 7.5, 7.6, 9.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement pure core logic: escape quiz game
  - [x] 4.1 Implement manifest validation, answer checking, and quiz markup in `js/core.js`
    - `validateManifest(artworks)` returning `{ ok, errors }`: 8 to 12 entries, unique non-empty ids, non-empty title/caption/alt/src, non-empty question, 3 or 4 non-empty options, integer `correctIndex` in range; each error names the artwork id (or index) and field
    - `checkAnswer(artwork, optionIndex)` true iff the index equals `correctIndex`
    - `renderQuizHTML(artwork)` producing a `<fieldset>` with `<legend tabindex="-1">` holding the prompt, one labeled radio per option (escaped, no hint of the correct one), and a native submit button
    - _Requirements: 9.4, 10.1, 10.2, 10.3, 11.1, 11.2, 15.1, 15.2_

  - [ ]* 4.2 Write property test for manifest validation
    - `tests/manifest.property.test.js`
    - **Property 15: Manifest validation accepts exactly the valid question shapes**
    - **Validates: Requirements 9.4, 10.1, 10.2**

  - [ ]* 4.3 Write property tests for quiz markup and answer checking
    - `tests/quiz.property.test.js`
    - **Property 16: Quiz markup shows the prompt and every option**
    - **Property 17: Answer checking matches the correct index**
    - **Validates: Requirements 10.2, 10.3, 11.1, 11.2, 15.1**

  - [x] 4.4 Implement game state logic in `js/core.js`
    - `initialProgress()` and `restartProgress()` returning `{ cleared: [] }`
    - `deriveStatus(artworks, progress)` returning `states`, `currentId`, `escaped` from the cleared prefix and manifest order
    - `submitAnswer(artworks, progress, artworkId, optionIndex)` returning `correct` (append id, `unlockedId`, `escaped`), `incorrect` (progress unchanged, no attempt counter or lives), or `rejected` (non-current id or escaped game)
    - _Requirements: 11.1, 11.2, 11.6, 11.7, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 13.1, 14.6_

  - [ ]* 4.5 Write property tests for derived status and correct answers
    - `tests/status.property.test.js`
    - **Property 18: Derived status follows the linear path**
    - **Property 19: A correct answer clears the current artwork and unlocks the next**
    - **Validates: Requirements 11.1, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6**

  - [ ]* 4.6 Write property tests for wrong answers, rejection, and escape
    - `tests/submit.property.test.js`
    - **Property 20: Wrong answers never change progress and never end the game**
    - **Property 21: Answers for non-current artworks are rejected**
    - **Property 22: Escape occurs exactly when the last artwork is cleared**
    - **Validates: Requirements 11.2, 11.6, 11.7, 12.3, 12.4, 13.1, 13.2**

  - [x] 4.7 Implement progress persistence helpers in `js/core.js`
    - `serializeProgress(progress)` producing `{"v":1,"cleared":[...]}`
    - `parseProgress(text, artworks)` returning null for invalid JSON, wrong version, non-array or non-string entries, duplicates, unknown ids, or a non-prefix of the Path
    - `loadProgress(storage, artworks)` (discard bad data and clear the key, never throws), `saveProgress(storage, progress)` and `clearProgress(storage)` (never throw), using key `spookyGallery.progress`
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 4.8 Write property tests for progress persistence
    - `tests/progress.property.test.js`
    - **Property 23: Progress round-trips through serialization and storage**
    - **Property 24: Malformed or foreign progress is discarded**
    - **Validates: Requirements 14.1, 14.2, 14.4**

  - [ ]* 4.9 Write property test for restart
    - `tests/restart.property.test.js` using fake storage holding progress and a safe mode value
    - **Property 26: Restart resets progress and keeps settings**
    - **Validates: Requirements 12.1, 14.6, 14.7**

  - [x] 4.10 Implement scare gating, announcements, and quiz feedback helpers in `js/core.js`
    - `canTriggerScare({ status, itemId, assignments, source })`: hover and touch need a Scare_Item that is not locked (cleared stays active); wrong-answer needs `itemId === status.currentId`
    - `wrongAnswerEffectType(assignments, itemId)` returning the assigned type, or `shake` for non-scare items
    - `announcementFor({ kind, title, nextTitle })` for `correct`, `incorrect`, `unlock`, `escape`, `reset` with distinct non-empty texts
    - `quizFeedbackMode({ safeMode, reducedMotion })` returning no animation or flashing when either flag is set
    - _Requirements: 3.3, 6.1, 7.3, 7.4, 11.3, 11.4, 11.8, 11.9, 12.3, 12.6, 12.7, 13.3, 13.5, 14.6, 15.6_

  - [ ]* 4.11 Write property tests for gating and wrong-answer effects
    - `tests/gating.property.test.js`
    - **Property 27: Scares only fire from unlocked scare items for hover and touch**
    - **Property 28: Wrong-answer scare uses the assigned effect, with shake for non-scare items**
    - **Validates: Requirements 3.3, 6.1, 7.3, 7.4, 11.3, 11.4, 12.3, 12.7, 13.5**

  - [ ]* 4.12 Write property tests for busy scheduler, announcements, and quiz feedback
    - `tests/announce.property.test.js`
    - **Property 29: A busy scheduler never blocks recording an answer**
    - **Property 30: Announcements are non-empty and match the result**
    - **Property 32: Quiz feedback never animates or flashes in safe or reduced motion**
    - **Validates: Requirements 4.1, 4.3, 4.4, 11.1, 11.5, 11.8, 11.9, 12.6, 13.3, 14.6, 15.6**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement DOM layer
  - [x] 6.1 Implement `js/settings.js`
    - Thin wrapper around `core.loadSettings` / `core.saveSettings` using `window.localStorage` (guarded access) and `matchMedia('(prefers-reduced-motion: reduce)')` (treated as false if unavailable)
    - Keep sound state in memory only, defaulting to off
    - _Requirements: 5.1, 7.5, 7.6, 9.3_

  - [x] 6.2 Implement `js/progress.js`
    - `createProgressStore(storage, artworks)` returning `get()`, `set(progress)`, `reset()`
    - Load via `core.loadProgress` at creation, keep the in-memory copy as source of truth, swallow all storage errors
    - `reset()` sets memory to `restartProgress()` and calls `clearProgress`, leaving settings untouched
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.7_

  - [ ]* 6.3 Write property test for progress store under storage failure
    - `tests/progress-store.property.test.js` with throwing fake storage
    - **Property 25: Progress survives storage failure in memory**
    - **Validates: Requirements 14.3**

  - [x] 6.4 Implement `js/gallery.js`
    - Render the grid into `#gallery` from `Spooky.ARTWORKS` using `renderCardHTML(artwork, state)` and `deriveStatus`
    - Provide a re-render/update function that refreshes card states after answers, unlocks, and restart without animation under safe mode or reduced motion
    - Attach `error` handlers on images that swap in `renderPlaceholderHTML(title)`
    - _Requirements: 1.1, 1.3, 1.6, 9.1, 12.2, 12.5, 12.6, 15.6, 15.7_

  - [x] 6.5 Implement `js/scare-controller.js` with requestScare and gating
    - `createScareController({ cards, assignments, getStatus, getSettings, getSound, player, now, setTimeout })` returning `{ requestScare(itemId, { source }), destroy() }`, with UMD export so it can be tested in Node with fake cards
    - Mouse `pointerenter` handler calls `canTriggerScare` with `getStatus()` first, then starts the scare synchronously; no `focus`/`focusin` listeners; no handlers on the quiz panel or Win_Screen
    - Touch handling via gesture tracker (tap, 500 ms long-press timer), `preventDefault` on touch activations
    - `requestScare` for `wrong-answer` applies to any card via `wrongAnswerEffectType` and returns false when the scheduler refuses
    - Preload `altSrc` to determine `altLoaded`; apply `fx-flash`, `fx-shake`, `fx-static` classes and src swap; restore after `durationMs` and call `scheduler.end`
    - Route every scare through `tryStart`, `resolveEffect`, `shouldPlayAudio`, and the flash limiter; catch and ignore `player.play()` rejections or throws
    - _Requirements: 3.3, 3.4, 3.6, 4.1, 4.2, 4.3, 4.4, 5.4, 5.5, 5.7, 6.1, 6.2, 6.3, 6.4, 7.1, 7.3, 7.4, 7.7, 8.3, 9.2, 11.3, 11.4, 11.5, 12.3, 12.7, 13.5_

  - [ ]* 6.6 Write property test for audio failure handling
    - `tests/controller.property.test.js` using fake cards, fake clock, and failing players (reject, throw, never resolve)
    - **Property 8: Audio failure never blocks the scare**
    - **Validates: Requirements 5.7**

  - [ ]* 6.7 Write unit tests for controller behavior
    - Hover starts a scare synchronously with a fake clock (3.3)
    - Focus events do not start a scare (8.3)
    - `preventDefault` is called on touch activation (6.4)
    - Locked cards never scare; cleared scare items still scare (12.3, 12.7)
    - `requestScare` with `wrong-answer` runs a shake on a non-scare item and is refused while busy (11.4, 11.5)
    - Sound off yields zero stings at load (5.1)
    - _Requirements: 3.3, 5.1, 6.4, 8.3, 11.4, 11.5, 12.3, 12.7_

- [x] 7. Quiz UI, page shell, styling, and wiring
  - [x] 7.1 Implement `js/quiz.js`
    - Open the quiz panel only for the current card (click, tap, Enter, Space), render `renderQuizHTML`, and move focus to the prompt legend; locked and cleared cards never open it
    - On submit call `submitAnswer`: on `correct` save progress, re-render cards, announce `correct` then `unlock` or `escape`, and open the next question or show the Win_Screen; on `incorrect` announce and call `requestScare(currentId, { source: 'wrong-answer' })` keeping focus on the answer controls; on `rejected` do nothing
    - Live region helper that clears then sets text in the same task so repeated messages are announced; answer feedback uses `quizFeedbackMode` (no animation class in safe mode or reduced motion)
    - Win_Screen: show `#win-screen`, move focus to its `h2`, announce `escape`; include a Restart_Control and no scare handlers
    - Restart: `progress.reset()`, re-render, hide quiz panel and Win_Screen, announce `reset`, leave safe mode and sound untouched
    - _Requirements: 10.3, 11.1, 11.2, 11.3, 11.5, 11.8, 11.9, 12.4, 12.6, 13.1, 13.2, 13.3, 13.4, 13.5, 14.5, 14.6, 14.7, 15.1, 15.2, 15.4, 15.5, 15.6_

  - [ ]* 7.2 Write unit tests for quiz behavior
    - Live region text written synchronously on submit (11.8, 11.9)
    - Focus moves to the quiz prompt on open and to the win heading on escape (13.3, 15.4)
    - Focus stays on answer controls after a result (15.5)
    - Locked cards are focusable but do not open the panel (12.4, 15.7)
    - Restart keeps safe mode and sound state and hides the Win_Screen (14.6, 14.7)
    - _Requirements: 11.8, 11.9, 12.4, 13.3, 14.6, 14.7, 15.4, 15.5, 15.7_

  - [x] 7.3 Create `index.html` and `css/styles.css`
    - Header with `#sound-toggle`, `#safe-toggle`, and `#restart` native buttons using visible labels and `aria-pressed` on the toggles
    - `<div id="error-banner" role="alert" hidden>`, `<main>` with `<ul id="gallery">`, `<section id="quiz-panel" hidden>`, `<section id="win-screen" hidden>` with `<h2 tabindex="-1">` and a Restart button, `<div id="live-region" role="status" aria-live="polite" aria-atomic="true">`, `<noscript>` message
    - Classic `<script defer>` tags in order (artworks, core, settings, progress, gallery, scare-controller, quiz, main)
    - Responsive auto-fill grid (320 px to 1920 px, no horizontal scroll), dark theme (`#0b0710` / `#e8e2ee` / `#c77dff`)
    - Card state styles: `state-locked` dimmed (opacity 0.45), `state-cleared` with check glyph and border, `state-current` accent border, `.sr-only`, quiz panel and win screen styles
    - `.card:focus-visible` and quiz control `:focus-visible` outlines (3 px accent), `fx-flash`, `fx-shake`, `fx-static` classes, and a `prefers-reduced-motion` backstop
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.2, 2.3, 5.2, 7.2, 8.1, 8.2, 12.2, 12.5, 13.4, 14.5, 15.3, 15.6, 15.7_

  - [x] 7.4 Implement `js/main.js` and wire everything together
    - Read `window.Spooky.ARTWORKS` and run `validateManifest`; on failure show the error banner listing each problem, skip building the gallery and quiz, and still wire the sound, safe mode, and restart controls
    - Otherwise load settings and progress, compute `deriveStatus`, render the gallery, call `assignScares` with `Math.random`, and create the scare controller with an `Audio`-based player and `getStatus` reading current progress
    - Wire the quiz, win screen, restart, `#sound-toggle` (via `toggleSound`), and `#safe-toggle` (persisting via `saveSettings`), keeping labels and `aria-pressed` in sync
    - If stored progress shows `escaped`, show the Win_Screen on load without starting a scare
    - _Requirements: 3.1, 5.1, 5.2, 5.3, 5.6, 7.2, 7.5, 7.6, 9.4, 10.1, 10.2, 10.4, 14.2, 14.5, 14.6_

  - [ ]* 7.5 Write unit tests for bootstrap and error banner
    - Invalid manifest (missing question, wrong option count, bad `correctIndex`) shows the banner naming the problem while the toggles and restart control stay operable
    - Stored escaped progress shows the Win_Screen on load
    - _Requirements: 9.4, 10.1, 10.2, 14.2_

  - [ ]* 7.6 Write smoke and unit tests for static constraints
    - `tests/smoke.test.js`: manifest length 8 to 12, every artwork has a valid question, no `http(s)://` URLs in source, only allowed file extensions, no `type="module"` or `fetch`, no `<input type="file">` or `<form action>`, controls are `<button>` elements with labels, no lives counter or game-over element, audio files exist
    - Compute the text/background contrast ratio from the palette and assert at least 4.5:1
    - _Requirements: 1.2, 1.4, 2.1, 2.3, 7.2, 8.1, 10.1, 10.2, 10.4, 11.7_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Properties 1 to 32 are each covered by exactly one optional property test sub-task, and they run at least 100 iterations, tagged `Feature: spooky-gallery, Property N: <title>`
- Unit tests validate specific examples and edge cases
- Manual browser checks (grid reflow at 320, 768, 1920 px; opening `index.html` from disk; focus ring look; screen reader play-through) are outside this coding plan

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["2.5", "2.6", "2.7"] },
    { "id": 4, "tasks": ["2.8", "2.9", "2.10", "2.11"] },
    { "id": 5, "tasks": ["2.12", "4.1"] },
    { "id": 6, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 7, "tasks": ["4.5", "4.6", "4.7"] },
    { "id": 8, "tasks": ["4.8", "4.9", "4.10"] },
    { "id": 9, "tasks": ["4.11", "4.12", "6.1", "6.2", "6.4", "6.5"] },
    { "id": 10, "tasks": ["6.3", "6.6", "6.7", "7.1", "7.3"] },
    { "id": 11, "tasks": ["7.2", "7.4"] },
    { "id": 12, "tasks": ["7.5", "7.6"] }
  ]
}
```
