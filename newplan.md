Build a multiplayer online "Haunted Escape Room" web app designed for team-based learning and collaboration.

### 1. Theme & Atmosphere
- Spooky, atmospheric haunted mansion theme with dark UI, subtle sound effects (toggleable), and creepy-fun visual cues.
- Use the attached Canva wireframes as the layout reference for the Lobby, Escape Room View, and Victory Screen.

### 2. Core Multiplayer & Team-Building Mechanics
- Room codes so 2–6 players can join the same session in real time.
- Shared inventory and synchronized puzzle state (when one player unlocks a clue, everyone sees it).
- Role-based or split-screen clues (e.g., Player A sees a ghost riddle on their screen while Player B has the cipher key) to force communication.
- Team chat or reaction pins + a shared countdown timer (e.g., 30 minutes) and a hint system.

### 3. Learning & Puzzle Structure
- Include 4 sequential rooms/stages. Each stage requires solving a puzzle tied to [INSERT YOUR SUBJECT/TOPIC, e.g., cybersecurity basics / high school biology / onboarding policies].
- Puzzle types: a locked chest code, a hidden-object clue inspection, a cooperative cipher, and a final boss riddle.
- Make puzzle content configurable via a JSON file so I can easily swap in new learning questions later.

### 4. Tech Stack & Constraints
- Frontend: [e.g., React + Tailwind CSS + Framer Motion for spooky animations]
- Real-time sync: [e.g., Supabase Realtime / Socket.io / Firebase]
- Keep it browser-based with no account login required (just enter a display name and room code).
