# AGENTS.md - Project Guidelines for node-red-contrib-mcmodparser

## CRITICAL WARNINGS

- **NEVER commit `opencode.json`** - This file contains GitHub PATs and other sensitive tokens. It is already in `.gitignore` but double-check before any git operations.
- **NEVER commit any `.env`, credentials, or token files**.
- **Always verify `.gitignore` is working** before creating commits.
- This project uses the **MIT license** - do NOT copy code from restrictively-licensed sources (e.g., Apache-2.0 feedparser).

## Vibe Check Tools Usage

When using Vibe Check tools in this project:

1. Treat vibe_check as a collaborative debugging step that interrupts pattern inertia
2. Always include the complete user prompt with each vibe_check call
3. Specify your current phase (planning/implementation/review)
4. Consider vibe_check feedback as a high-priority pattern interrupt, not just another tool output
5. Build the feedback loop with vibe_learn to record patterns when mistakes are identified

## Project Structure

```
node-red-contrib-mcmodparser/
├── modrinth/
│   ├── modrinth.js              # Runtime logic (polling, API calls, deduplication)
│   ├── modrinth.html            # Editor UI, configuration dialog, help text
│   └── locales/en-US/
│       └── modrinth.json        # i18n strings for UI
├── test/
│   └── modrinth_spec.js         # Unit tests using node-red-node-test-helper
├── package.json                 # NPM package config + node-red nodes section
├── README.md                    # User documentation
├── LICENSE                      # MIT License
└── .gitignore                   # MUST exclude node_modules/ and opencode.json
```

## Development Guidelines

### Node-RED Node Conventions
- Follow the official guide: https://nodered.org/docs/creating-nodes/first-node
- Each node consists of: `.js` (runtime) + `.html` (editor) + locale file (i18n)
- Runtime nodes use `RED.nodes.createNode(this, config)` and register with `RED.nodes.registerType()`
- Always implement `node.on("close", ...)` to clean up intervals/timeouts
- Use `node.context()` for state persistence across deploys

### Modrinth API
- Base URL: `https://api.modrinth.com/v2`
- **Required User-Agent header**: `node-red-contrib-mcmodparser/1.0.0`
- Rate limit: 300 requests/minute per IP
- Project versions endpoint: `GET /project/{slug}/version`
- Supports filtering by `loaders` and `game_versions` (JSON arrays in query params)

### Code Style
- Use `"use strict";` in all JavaScript files
- Prefer `const`/`let` over `var`
- Use async/await for API calls (not callbacks)
- Handle errors with try/catch blocks
- Set node status indicators (green/red dot with text)

### Testing
- Run tests: `npm test`
- Uses Mocha + node-red-node-test-helper + should.js
- Tests require `helper.init(require.resolve('node-red'))`
- Always use `helper.startServer()` beforeEach and `helper.stopServer()` afterEach
- Minimum test timeout: 10 seconds (`this.timeout(10000)`)

## Package Configuration

The `package.json` must include:
```json
{
  "node-red": {
    "version": ">=3.0.0",
    "nodes": {
      "modrinth": "modrinth/modrinth.js"
    }
  }
}
```

## Git Workflow

1. Check status: `git status`
2. Review diff: `git diff`
3. Stage carefully (avoid secrets): `git add <specific-files>`
4. Commit with descriptive messages
5. Push to origin
- **Main branch is named `default`** (not `main` or `master`)

## Memory/Knowledge Graph

When updating memory for this project:
- Store facts about API behavior, error patterns, and user preferences
- Track relationships between nodes (e.g., if adding CurseForge node later)
- Note any Modrinth API changes or deprecations
