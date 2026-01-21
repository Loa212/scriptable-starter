This repository is meant to produce one (or more) **Scriptable** scripts that run on iOS/iPadOS and render a Home/Lock Screen widget.

If you are an AI agent working in this repo: follow this doc strictly. Scriptable is **not Node.js**.

---

## 1) Runtime constraints (Scriptable specifics)

- **JavaScriptCore / ES6** environment (not Node):
  - No `fs`, no `path` module, no `process`, no npm packages, no bundler assumptions.
  - Use Scriptable APIs instead: `FileManager`, `Request`, `Keychain`, `ListWidget`, etc.
- Scriptable treats each file as a **module**:
  - Import local modules with `importModule("fileOrPath")`.
  - Export via `module.exports = ...` (CommonJS-like).
- Widgets have tighter limits:
  - Be conservative with memory (large images can crash widgets).
  - Prefer caching and small payloads.
  - Avoid long-running work while in widget mode.

---

## 2) Repo layout (recommended)

Keep Scriptable-run code in a single top-level folder so it can be copied/synced into Scriptable easily.

Suggested structure:

- `scriptable/`
  - `main.js` → entry point (the script you run / attach to widget)
  - `lib/`
    - `api.js` → HTTP fetch logic (Request), parsing
    - `cache.js` → disk cache helpers (FileManager)
    - `secrets.js` → Keychain helpers
    - `ui.js` → widget UI builder (ListWidget)
    - `util.js` → shared utilities
  - `assets/` → optional local images/icons (keep small)

Notes:

- `importModule` can load modules **relative to the importing file**. Prefer `importModule("./lib/ui")` patterns.
- If you import a folder path, Scriptable will look for `index.js` inside it.

---

## 3) Entry-point contract (how `main.js` should behave)

`main.js` must support **both**:

1. Running inside a widget (`config.runsInWidget === true`)
2. Running in the Scriptable app for preview/debugging (`config.runsInApp === true`)

Required behavior:

- In widget mode:
  - Build a widget instance (usually `new ListWidget()`).
  - Call `Script.setWidget(widget)`.
  - Call `Script.complete()` at the end.
- In app mode:
  - Build the same widget and present a preview using `widget.presentSmall()/presentMedium()/presentLarge()`
  - Log useful diagnostics to console.

Also:

- Respect widget sizes using `config.widgetFamily` (`small`, `medium`, `large`, `accessoryRectangular`, etc.).
- Set `widget.refreshAfterDate` to a sensible refresh target (don’t hammer).

---

## 4) Configuration & parameters

Use Scriptable’s widget parameter mechanism:

- Read config from `args.widgetParameter`.
- If missing/invalid, show a “setup” widget state (or prompt when running in app mode).

Guidelines:

- Keep `args.widgetParameter` as a simple string (e.g. JSON string, or `key=value;key=value`).
- Validate and sanitize. Never assume it exists.

---

## 5) Secrets & sensitive data

- Store tokens/credentials in **Keychain** (never hardcode secrets in the repo).
- If the widget needs user-provided keys:
  - When `config.runsInApp`, prompt once and write to Keychain.
  - When `config.runsInWidget`, never show interactive prompts—render an error state instead.

Never:

- Commit API keys
- Log secrets
- Write secrets to plain files

---

## 6) Networking (HTTP)

Scriptable uses `Request` for HTTP.
Rules:

- Always set a reasonable `timeoutInterval`.
- Handle non-200 responses.
- On failure, fall back to cache when possible.
- Keep payloads small (request only what you need).

Caching strategy:

- Cache successful responses on disk with a TTL.
- When in widget mode, prefer cached data if the network is slow/unavailable.

---

## 7) Disk storage & caching

Use `FileManager`:

- Prefer `FileManager.iCloud()` only if you explicitly want Files/iCloud visibility and you handle downloading.
- Prefer `FileManager.local()` / `libraryDirectory()` for internal caches.

Rules:

- Put durable user-visible files in `documentsDirectory()`.
- Put internal long-term storage in `libraryDirectory()`.
- Put short-lived items in `cacheDirectory()` or `temporaryDirectory()`.

When reading from iCloud:

- If a file might be in iCloud but not downloaded, call `downloadFileFromiCloud(path)` before reading.

---

## 8) UI rules (ListWidget)

- Keep layout simple and predictable per size.
- Use `ListWidget` + stacks (`addStack`) for rows/columns.
- Avoid huge images:
  - Prefer SF Symbols for icons where possible.
  - If you must download images, cache them and downsize if feasible.

Accessibility/readability:

- Ensure text is legible on both light/dark wallpapers.
- Avoid relying solely on color to convey meaning.

---

## 9) Error handling & fallback behavior

Never crash silently in widget mode.

If something goes wrong:

- Render a compact error widget:
  - Title (what failed)
  - One-line hint (how to fix)
  - Timestamp (last attempt)
- Prefer returning stale cached data over blank UI.

When running in app mode:

- `console.log` / `console.error` details.
- Optionally show an `Alert` for actionable setup steps.

---

## 10) Development workflow (how to iterate)

Recommended loop:

1. Edit code in this repo.
2. Copy/sync `scriptable/` files into Scriptable’s folder (iCloud Drive Scriptable folder if enabled).
3. Run `main.js` in Scriptable app to preview using `presentSmall/Medium/Large`.
4. Add the script as a widget and verify on Home/Lock Screen.

Debugging:

- Use `console.log` (Scriptable console).
- Add a “debug mode” switch via `args.widgetParameter` when helpful.

---

## 11) PR / change expectations for agents

When you change behavior, you must also:

- Update any README/docs if configuration changes.
- Keep `main.js` as the stable entry point unless explicitly told otherwise.
- Avoid introducing non-Scriptable dependencies.

Before marking a task “done”, ensure:

- Widget renders in **small + medium** at minimum.
- Works in both `config.runsInWidget` and `config.runsInApp`.
- Handles empty state, loading/failure state, and happy path.

---

## 12) Quick checklist (agent self-review)

- [ ] No Node APIs used
- [ ] No external packages assumed
- [ ] Uses `Request` for HTTP
- [ ] Uses `Keychain` for secrets
- [ ] Uses `FileManager` for caching
- [ ] Supports widget + app preview modes
- [ ] Sets `Script.setWidget(widget)` + `Script.complete()` in widget mode
- [ ] Uses `args.widgetParameter` for configuration
- [ ] Handles errors with a visible fallback UI
- [ ] Conservative memory usage (especially images)
