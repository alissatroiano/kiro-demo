Build an interactive **3D Haunted Art Gallery Escape Room** web application using HTML, CSS 3D transforms (`perspective` and `preserve-3d`), and modular JavaScript—with zero heavy external 3D engines required.

### 1. Core Concept & Dual-Mode Experience
- **Gallery Mode (Initial State):** Visitors walk down a dimly lit 3D corridor (`W`/`S`, Arrow keys, mouse wheel, and mouse-look) lined with framed artworks on the left and right walls and a locked heavy wooden door at the far end (`-3200px`).
- **Haunted Escape Room Transformation:** Triggered either automatically after inspecting a set number of paintings or via an atmospheric event (e.g., lights flicker, color palette shifts to eerie crimson/moonlight, ambient tension increases, and the end door locks with a keypad/combination lock).
- **Escape Condition:** Players click paintings to inspect artwork details and solve embedded **clues, riddles, or trivia questions**. Solving clues reveals digits/codewords or unlocks fragments needed to unlock the door at the end of the corridor and escape.

### 2. Educator & Team Leader Content Management (No-Code Editing)
Educators and team leaders must be able to easily customize the gallery and escape room questions without editing core JavaScript logic:
- **External JSON Configuration (`gallery-config.json`):** Store room theme settings (gallery title, intro message, escape trigger threshold, final door passcode, victory message) and an array of artwork objects (`id`, `wall`, `zPosition`, `title`, `artist`, `year`, `imageUrl`, `loreText`, `clueQuestion`, `clueType` [multiple-choice | text-input | clue-only], `options`, `correctAnswer`, `rewardHint`).
- **Built-in "Builder / Editor Mode" (`?edit=true` or HUD toggle button):**
  - Allows an educator or facilitator to add, edit, reorder, or delete paintings, swap image URLs, write custom trivia/escape questions, set the final door code, and preview the 3D hallway live.
  - Supports **Export JSON** (download updated `gallery-config.json`), **Import JSON**, and **Generate Shareable Link** (encoding compact config or saving to `localStorage`) so facilitators can distribute custom rooms to students or teams.

### 3. Interactive UI & Game Mechanics
- **3D Navigation:** Smooth `requestAnimationFrame` camera lerp, bounded corridor collision (`MIN_Z` to `MAX_Z`), keyboard + scroll movement, mouse-look head rotation, and mobile/accessibility on-screen navigation controls.
- **Interactive Painting Modal:** Clicking a painting pauses 3D movement and opens an accessible modal displaying the high-res artwork, curator/haunted lore, and the interactive question or clue card with instant feedback and progress tracking.
- **Locked End Door & Escape Sequence:** Clicking the door at the end of the hallway opens a combination/passcode lock UI showing collected clue hints. Entering the correct code swings the 3D door open (`rotateY(-108deg)`) and triggers an escape victory screen with completion time and summary.

### 4. Technical & Architectural Preferences
- Keep the architecture clean and modular (`index.html`, `styles.css`, `js/engine3d.js`, `js/gameState.js`, `js/editor.js`, `data/gallery-config.json`).
- Ensure full keyboard accessibility (`Escape` to close modals, focus trapping inside modals) and clean fallback handling if an artwork image URL fails to load.
