# 🏛️🕯️ After Hours: The Living Museum

> **A 3D CSS Art Gallery that wears a haunted costume.**  
> Built for **Kiroween 2026 — Costume Contest Category**

**After Hours: The Living Museum** is an interactive, zero-dependency 3D web application designed for educators, students, and team facilitators. By day (**Light Mode**), it is a bright, peaceful art museum where visitors walk the corridor and study curated artworks. Flip the **After-Hours (Dark Mode)** switch, and the entire 3D gallery puts on a haunted costume—transforming into a locked **Escape Room** where every painting hides an interactive puzzle needed to shatter the chains sealing the exit door.

---

## ✨ Key Features

### 1. The "Costume Toggle" (Daylight Museum ↔ Haunted Escape Room)
* **☀️ Daylight Gallery Mode (Study & Exploration):** Warm architectural gallery walls, oak floors, curator plaques with historical context, and an open corridor built with pure CSS 3D transforms (`perspective` & `preserve-3d`).
* **🌙 After-Hours Mode (Active Recall Escape Room):** Toggling Dark Mode transforms the entire CSS custom-property palette—dimming the lights with a flickering candlelit vignette, tarnishing the picture frames, sealing the exit door at `-3200px` with **5 spectral chains**, and unlocking interactive challenges on each canvas.

### 2. Five Distinct Interactive Painting Challenges
Each artwork along the corridor features a unique puzzle mechanic that turns spooky visual design into functional learning:
1. **UV Lantern Reveal (`uv-reveal`):** Sweep a cursor-controlled UV spotlight over the canvas to uncover hidden blood-ink dates and annotations.
2. **Cursed Cipher Dial (`dial-align`):** Rotate concentric geometric rings on the painting until the glowing runes align.
3. **Curator's Riddling Plaque (`riddle-plaque`):** Solve haunted riddles or customizable educator trivia questions.
4. **Echoes in the Dark (`audio-sequence`):** Listen to (and watch via accessible candle flashes) a procedural 3-note Web Audio organ sequence and repeat it.
5. **Chronological Relic Sort (`order-sort`):** Arrange spectral exhibition cards into the correct historical order to break the final seal.

### 3. No-Code Educator & Facilitator Studio (Zero-Backend Sharing)
* **Live Room Customizer:** Educators and team leaders can edit gallery titles, artwork URLs, Daylight Curator notes, and After-Hours puzzle prompts/answers directly in the browser.
* **Built-In Presets:** Switch between *"19th-Century Art History Review"* and *"Team Onboarding & Icebreaker"* with one click.
* **Shareable Hash URLs (`#room=...`) & JSON Export:** Custom rooms compress directly into a shareable URL—requiring **zero student logins, zero databases, and zero server setup** on restricted school Chromebooks.

---

## 🎮 Controls

| Action | Input |
| :--- | :--- |
| **Walk Forward / Backward** | `W` / `S`, `↑` / `↓` Arrow Keys, Mouse Wheel, or On-Screen HUD Buttons |
| **Look Around** | Move Mouse Cursor |
| **Inspect Painting / Solve Clue** | Click any framed artwork |
| **Transform Museum (Costume Toggle)** | Click **Daylight / After Hours** in the top HUD |
| **Close Modal** | `Escape` key or `×` button |

---

## 🚀 Quick Start (Run Locally)

Because **After Hours** is built with zero-dependency static HTML5, CSS3, and ES6 Modules, no build step is required:

1. **Clone the repository:**
   ```bash
   git clone https://github.com<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```
2. **Serve locally** (using VS Code Live Server, Kiro preview, or Python):
   ```bash
   python3 -m http.server 8080
   ```
3. Open `http://localhost:8080` in your browser.

---

## 🤖 How Kiro Was Used

All Kiro artifacts are committed in the `/.kiro` directory at the root of this repository:
* **Steering Docs (`.kiro/steering/`):** Enforced zero-dependency static ES6 architecture, CSS 3D spatial invariants, and accessibility standards across every generation.
* **Spec-Driven Development (`.kiro/specs/`):** Structured EARS requirements, modular design (`engine3d`, `puzzles`, `audio`, `editor`, `storage`), and incremental implementation tasks before writing feature code.
* **Agent Hooks (`.kiro/hooks/`):** Automated JSON schema validation and property-based test checks on file edits.
* **Property-Based Testing (PBT):** Verified critical game invariants—including exit-door lock guarantees across all `0..4` solved subsets, corridor `MIN_Z`/`MAX_Z` camera bounds, and lossless `#room=` URL compression round-trips.

---

## 📁 Project Structure

```text
├── .kiro/                  # Kiro steering docs, specs, and agent hooks
├── data/
│   └── gallery-config.json # Default exhibition & 5-challenge escape room config
├── js/
│   ├── engine3d.js         # CSS 3D corridor rendering & smooth camera loop
│   ├── puzzles.js          # 5 interactive painting challenge renderers
│   ├── audio.js            # Procedural Web Audio synthesizer (footsteps, chimes, creaks)
│   ├── editor.js           # No-code Educator & Facilitator Studio drawer
│   └── storage.js          # localStorage, JSON import/export, & #room= URL compression
├── index.html
├── style.css
├── LICENSE                 # MIT License
└── README.md
```

---

## 📄 License

This project is open source under the [MIT License](LICENSE).
