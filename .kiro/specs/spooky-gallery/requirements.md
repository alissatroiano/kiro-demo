# Requirements Document

## Introduction

Spooky Gallery is a static spooky escape quiz game built with plain HTML, CSS, and JavaScript, with no build step, backend, or uploads. The game displays 8 to 12 bundled spooky artworks (placeholder SVG or generated art). Each artwork carries one multiple-choice question stored in the artwork manifest. The Visitor progresses along a linear path: each artwork unlocks only after the previous artwork's question is answered correctly, and answering the last question correctly lets the Visitor escape. A wrong answer triggers a jump scare, and retries are unlimited with no lives and no game over. Some or all artworks also hide an unsignposted jump scare that triggers on hover (or tap or long-press on touch devices) while the artwork is unlocked: a visual effect (flash, shake, or creepy image swap) plus a short audio sting. Sound is off until the Visitor opts in. Progress is saved in browser local storage with an in-memory fallback. The game honors the `prefers-reduced-motion` setting and provides a toggle to disable flashing and sound.

## Glossary

- **Gallery**: The static web page that displays the collection of Artworks in a grid.
- **Artwork**: A single bundled SVG or generated image shown as one item in the Gallery.
- **Scare_Item**: An Artwork that has a hidden Jump_Scare attached.
- **Jump_Scare**: A sudden effect consisting of a Visual_Effect and, when permitted, an Audio_Sting.
- **Visual_Effect**: One of a screen flash, an element shake, or a swap to a creepy alternate image.
- **Audio_Sting**: A short sound clip of 2 seconds or less played with a Jump_Scare.
- **Scare_Controller**: The JavaScript module that detects triggers and runs Jump_Scares.
- **Sound_Opt_In**: A visitor action that enables Audio_Stings for the current session.
- **Safe_Mode_Toggle**: A user control that disables flashing and sound.
- **Reduced_Motion_Preference**: The visitor's `prefers-reduced-motion: reduce` operating system or browser setting.
- **Cooldown**: A minimum interval between two Jump_Scares on the same Scare_Item.
- **Visitor**: A person viewing the Gallery.
- **Game**: The spooky escape quiz built on the Gallery.
- **Artwork_Manifest**: The bundled static data file that lists each Artwork with its title, caption, alternative text, image paths, Visual_Effect, and Quiz_Question.
- **Quiz_Question**: A multiple-choice question attached to one Artwork, consisting of a prompt, 3 or 4 answer options, and exactly one correct option.
- **Quiz_Panel**: The user interface that presents a Quiz_Question and its answer options.
- **Path**: The fixed linear order of Artworks as listed in the Artwork_Manifest.
- **Locked_Artwork**: An Artwork whose predecessor on the Path has not been answered correctly.
- **Unlocked_Artwork**: An Artwork that is the first on the Path or whose predecessor on the Path has been answered correctly.
- **Current_Artwork**: The first Unlocked_Artwork on the Path whose Quiz_Question has not been answered correctly.
- **Cleared_Artwork**: An Artwork whose Quiz_Question has been answered correctly.
- **Progress**: The set of Cleared_Artworks and the escaped state of the Game.
- **Escape**: The win state reached when the Quiz_Question of the last Artwork on the Path is answered correctly.
- **Win_Screen**: The screen shown to the Visitor after Escape.
- **Restart_Control**: A user control that resets Progress.
- **Live_Region**: An `aria-live` element that announces Game results to assistive technology.
- **Scare_Scheduler**: The part of the Scare_Controller that enforces running-state and Cooldown rules.
- **Effect_Resolver**: The part of the Scare_Controller that selects the effective Visual_Effect given Safe_Mode_Toggle and Reduced_Motion_Preference.
- **Audio_Gate**: The part of the Scare_Controller that decides whether an Audio_Sting is played.
- **Flash_Limiter**: The part of the Scare_Controller that enforces the flash frequency limit.

## Requirements

### Requirement 1: Gallery Display

**User Story:** As a visitor, I want to browse a themed gallery of spooky artworks, so that I can enjoy the atmosphere.

#### Acceptance Criteria

1. THE Gallery SHALL display between 8 and 12 Artworks in a grid layout.
2. THE Gallery SHALL load all Artworks from bundled static files without network requests to external origins.
3. THE Gallery SHALL display a title and a caption for each Artwork.
4. THE Gallery SHALL apply a dark, spooky visual theme with text contrast of at least 4.5:1 against its background.
5. WHEN the viewport width changes between 320px and 1920px, THE Gallery SHALL reflow the grid without horizontal scrolling.
6. THE Gallery SHALL provide alternative text for each Artwork.

### Requirement 2: Static Site Constraints

**User Story:** As a developer, I want the site to be plain static files, so that I can host it anywhere without tooling.

#### Acceptance Criteria

1. THE Gallery SHALL consist of HTML, CSS, JavaScript, SVG, and audio files only.
2. WHEN the index.html file is opened directly in a browser, THE Gallery SHALL render and function without a build step or web server-side code.
3. THE Gallery SHALL include no upload feature and no backend dependency.

### Requirement 3: Hover Jump Scares

**User Story:** As a visitor, I want hidden jump scares when I hover over artworks, so that browsing feels suspenseful.

#### Acceptance Criteria

1. THE Gallery SHALL designate at least 3 and at most all Artworks as Scare_Items.
2. THE Gallery SHALL present Scare_Items with no visual indicator that distinguishes them from other Artworks, other than the locked, unlocked, cleared, and current-question states defined in Requirement 12.
3. WHEN a pointer hovers over an Unlocked_Artwork that is a Scare_Item, THE Scare_Controller SHALL start a Jump_Scare within 100ms.
4. THE Scare_Controller SHALL run each Jump_Scare using at least one Visual_Effect.
5. THE Scare_Controller SHALL assign each Scare_Item exactly one of the Visual_Effect types: flash, shake, or image swap.
6. WHEN a Jump_Scare ends, THE Scare_Controller SHALL restore the Scare_Item to its original appearance within 2 seconds of the Jump_Scare start.

### Requirement 4: Scare Pacing

**User Story:** As a visitor, I want scares to not repeat endlessly, so that the gallery stays usable.

#### Acceptance Criteria

1. WHILE a Jump_Scare is running on a Scare_Item, THE Scare_Controller SHALL ignore additional triggers on that Scare_Item.
2. WHEN a Jump_Scare ends, THE Scare_Controller SHALL apply a Cooldown of 5 seconds to that Scare_Item.
3. WHILE a Cooldown is active on a Scare_Item, THE Scare_Controller SHALL ignore triggers on that Scare_Item.
4. WHILE a Jump_Scare is running on any Scare_Item, THE Scare_Controller SHALL ignore triggers on all other Scare_Items.

### Requirement 5: Opt-In Sound

**User Story:** As a visitor, I want sound to stay off until I choose to enable it, so that I am not startled by unexpected audio.

#### Acceptance Criteria

1. WHEN the Gallery loads, THE Gallery SHALL set sound to off.
2. THE Gallery SHALL provide a visible control to enable sound.
3. WHEN the Visitor activates the Sound_Opt_In control, THE Scare_Controller SHALL permit Audio_Stings for the current session.
4. WHILE sound is off, THE Scare_Controller SHALL run Jump_Scares without playing any Audio_Sting.
5. WHILE sound is on, THE Scare_Controller SHALL play one Audio_Sting with each Jump_Scare.
6. WHEN the Visitor activates the sound control while sound is on, THE Scare_Controller SHALL set sound to off.
7. IF audio playback is rejected by the browser, THEN THE Scare_Controller SHALL complete the Jump_Scare using the Visual_Effect only.

### Requirement 6: Touch Fallback

**User Story:** As a visitor using a touch device, I want to trigger scares by touch, so that the experience works without hover.

#### Acceptance Criteria

1. WHEN the Visitor taps an Unlocked_Artwork that is a Scare_Item on a device without hover capability, THE Scare_Controller SHALL start a Jump_Scare.
2. WHEN the Visitor long-presses an Unlocked_Artwork that is a Scare_Item for 500ms on a device without hover capability, THE Scare_Controller SHALL start a Jump_Scare.
3. WHEN a single touch gesture produces both a tap and a long-press event, THE Scare_Controller SHALL start exactly one Jump_Scare.
4. WHEN the Visitor taps a Scare_Item that is not on cooldown, THE Gallery SHALL not navigate away from the page.

### Requirement 7: Safe Mode and Reduced Motion

**User Story:** As a visitor sensitive to flashing or motion, I want to reduce or disable intense effects, so that I can browse safely.

#### Acceptance Criteria

1. WHILE the Reduced_Motion_Preference is active, THE Scare_Controller SHALL replace flash and shake Visual_Effects with a non-animated image swap lasting 1 second.
2. THE Gallery SHALL provide a Safe_Mode_Toggle that is keyboard operable and labeled.
3. WHILE the Safe_Mode_Toggle is on, THE Scare_Controller SHALL suppress all flashing effects and all Audio_Stings.
4. WHILE the Safe_Mode_Toggle is on, THE Scare_Controller SHALL replace flash and shake Visual_Effects with a non-animated image swap.
5. WHEN the Visitor changes the Safe_Mode_Toggle, THE Gallery SHALL persist the setting in browser local storage and apply it on the next page load.
6. WHEN the Gallery loads with the Reduced_Motion_Preference active and no stored Safe_Mode_Toggle value, THE Gallery SHALL set the Safe_Mode_Toggle to on.
7. THE Scare_Controller SHALL limit any flash to no more than 3 flashes in any 1-second period.

### Requirement 8: Keyboard Accessibility

**User Story:** As a keyboard user, I want to access the gallery and its controls, so that I can use the site without a mouse.

#### Acceptance Criteria

1. THE Gallery SHALL make the sound control and the Safe_Mode_Toggle reachable by keyboard Tab navigation.
2. WHEN an Artwork receives keyboard focus, THE Gallery SHALL display a visible focus indicator.
3. WHEN a Scare_Item receives keyboard focus, THE Scare_Controller SHALL not start a Jump_Scare.

### Requirement 9: Asset and Storage Failures

**User Story:** As a visitor, I want the site to stay stable if assets fail, so that the gallery remains usable.

#### Acceptance Criteria

1. IF an Artwork image fails to load, THEN THE Gallery SHALL display a placeholder with the Artwork title.
2. IF an alternate image for an image swap fails to load, THEN THE Scare_Controller SHALL run a shake Visual_Effect on the Scare_Item instead.
3. IF local storage is unavailable, THEN THE Gallery SHALL use default settings for the current page session.
4. IF the Artwork_Manifest fails to load or contains an Artwork without a valid Quiz_Question, THEN THE Gallery SHALL display an error message identifying the problem and keep the remaining controls operable.

### Requirement 10: Quiz Questions

**User Story:** As a visitor, I want each artwork to pose a multiple-choice question, so that I can solve my way through the gallery.

#### Acceptance Criteria

1. THE Artwork_Manifest SHALL define exactly one Quiz_Question for each Artwork.
2. THE Artwork_Manifest SHALL define 3 or 4 answer options and exactly one correct option for each Quiz_Question.
3. WHEN the Visitor selects the Current_Artwork, THE Gallery SHALL display the Quiz_Panel with the Quiz_Question prompt and all answer options.
4. THE Gallery SHALL load Quiz_Questions from the Artwork_Manifest without network requests to external origins.

### Requirement 11: Answer Handling

**User Story:** As a visitor, I want immediate feedback on my answers and unlimited retries, so that I can keep trying without being eliminated.

#### Acceptance Criteria

1. WHEN the Visitor submits the correct answer for the Current_Artwork, THE Gallery SHALL mark that Artwork as a Cleared_Artwork and unlock the next Artwork on the Path.
2. WHEN the Visitor submits an incorrect answer, THE Gallery SHALL keep the Quiz_Question unanswered and allow the Visitor to submit another answer.
3. WHEN the Visitor submits an incorrect answer, THE Scare_Controller SHALL request a Jump_Scare on the Current_Artwork through the Scare_Scheduler, the Effect_Resolver, the Audio_Gate, and the Flash_Limiter.
4. IF the Current_Artwork is not a Scare_Item, THEN WHEN the Visitor submits an incorrect answer, THE Scare_Controller SHALL run a shake Visual_Effect on the Current_Artwork through the same components.
5. WHILE the Scare_Scheduler is ignoring triggers because a Jump_Scare is running or a Cooldown is active, THE Gallery SHALL still record and announce an incorrect answer without starting another Jump_Scare.
6. THE Gallery SHALL allow an unlimited number of answer attempts for each Quiz_Question.
7. THE Gallery SHALL provide no lives counter and no game-over state.
8. WHEN the Visitor submits a correct answer, THE Gallery SHALL announce the result in the Live_Region within 500ms.
9. WHEN the Visitor submits an incorrect answer, THE Gallery SHALL announce the result in the Live_Region within 500ms.

### Requirement 12: Linear Locked Path

**User Story:** As a visitor, I want artworks to unlock one after another, so that the game has a clear order.

#### Acceptance Criteria

1. WHEN the Game starts with no stored Progress, THE Gallery SHALL unlock only the first Artwork on the Path.
2. THE Gallery SHALL display every Locked_Artwork as visible and dimmed.
3. WHILE an Artwork is a Locked_Artwork, THE Gallery SHALL not start a Jump_Scare from hover, tap, or long-press on that Artwork.
4. WHILE an Artwork is a Locked_Artwork, THE Gallery SHALL not display the Quiz_Panel for that Artwork.
5. THE Gallery SHALL expose the locked, unlocked, cleared, and current-question state of each Artwork both visually and to assistive technology.
6. WHEN an Artwork becomes unlocked, THE Gallery SHALL remove the dimming from that Artwork and announce the unlock in the Live_Region.
7. WHILE an Unlocked_Artwork is a Cleared_Artwork, THE Gallery SHALL keep hover, tap, and long-press scares active for that Artwork if it is a Scare_Item.

### Requirement 13: Escape and Win Screen

**User Story:** As a visitor, I want a satisfying ending, so that finishing the game feels rewarding.

#### Acceptance Criteria

1. WHEN the Visitor submits the correct answer for the last Artwork on the Path, THE Gallery SHALL set the Game to the Escape state.
2. WHEN the Game enters the Escape state, THE Gallery SHALL display the Win_Screen.
3. WHEN the Win_Screen is displayed, THE Gallery SHALL move keyboard focus to the Win_Screen heading and announce the Escape in the Live_Region.
4. WHILE the Game is in the Escape state, THE Win_Screen SHALL provide access to the Restart_Control.
5. WHILE the Win_Screen is displayed, THE Scare_Controller SHALL not start a Jump_Scare from the Win_Screen content.

### Requirement 14: Progress Persistence and Restart

**User Story:** As a visitor, I want my progress saved and resettable, so that I can return later or play again.

#### Acceptance Criteria

1. WHEN the Visitor clears an Artwork, THE Gallery SHALL save Progress to browser local storage.
2. WHEN the Gallery loads with stored Progress, THE Gallery SHALL restore Cleared_Artworks, unlocked state, and Escape state from that Progress.
3. IF local storage is unavailable, THEN THE Gallery SHALL keep Progress in memory for the current page session.
4. IF stored Progress is malformed or references an Artwork absent from the Artwork_Manifest, THEN THE Gallery SHALL discard the stored Progress and start the Game from the first Artwork.
5. THE Gallery SHALL provide a visible, labeled, keyboard-operable Restart_Control.
6. WHEN the Visitor activates the Restart_Control, THE Gallery SHALL clear Progress from storage and memory, lock all Artworks except the first, hide the Win_Screen, and announce the reset in the Live_Region.
7. WHEN the Visitor activates the Restart_Control, THE Gallery SHALL preserve the sound setting and the Safe_Mode_Toggle setting.

### Requirement 15: Quiz Accessibility

**User Story:** As a keyboard or screen reader user, I want to play the quiz without a mouse, so that the game is accessible to me.

#### Acceptance Criteria

1. THE Quiz_Panel SHALL expose the question prompt as a label for a group of answer options.
2. THE Quiz_Panel SHALL allow selecting and submitting an answer using only the keyboard.
3. WHEN a quiz control receives keyboard focus, THE Gallery SHALL display a visible focus indicator with a contrast ratio of at least 3:1 against adjacent colors.
4. WHEN the Quiz_Panel opens, THE Gallery SHALL move keyboard focus to the Quiz_Panel prompt.
5. WHEN an answer result is announced, THE Gallery SHALL keep keyboard focus on the answer controls.
6. WHILE the Safe_Mode_Toggle is on or the Reduced_Motion_Preference is active, THE Gallery SHALL present answer feedback without flashing or animated motion.
7. THE Gallery SHALL allow the Visitor to focus a Locked_Artwork for reading its title and state without displaying the Quiz_Panel or starting a Jump_Scare.
