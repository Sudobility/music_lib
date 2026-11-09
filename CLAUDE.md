# @sudobility/music_lib

> **Git: never auto-commit or auto-push.** Leave work in the working tree; run
> `git commit`/`push`/`gh pr create`/`scripts/push_all.sh` only when the user asks
> in that turn. Stay on the current branch — no feature branches for code changes.

Frontend business logic for Moosiac (the Sudobility music-app family), **above
editing**: the composed app store and per-document stores, autosave + project
writes, the player binding (`bindPlayer`) and playback adapter, export planning
(`planExport`), the unsaved-work guard (`decideClose`/`decideQuit`), docs content
(`DOCS_TOPICS`, `RESOURCE_GROUPS`), generation request builders/drafts, credits,
device prefs (theme, developer mode + settings, keyboard, font size, language,
last generation provider; `resolveThemeMode`) and host copy wiring. It
**re-exports `music_types`, `music_editing`, `music_codecs` and `music_drawing`
wholesale**, so an app imports one package.

Every shared type and closed vocabulary is music_types'; every operation that
changes a score is music_editing's. There is no domain code here — the model,
commands and pure primitives (including `music-vocabulary.ts`:
note-value/key/bar-beat names and `pitchAtStavePosition`) are music_types' and
are re-exported.

## Commands

- `bun install`
- `bun run verify` — format:check + typecheck + lint + test:unit + build. Before any push.
- `bun run test:unit` / `test:watch` — vitest (+ jsdom)
- `bun run build` — `tsc` typechecks (`noEmit`), `vite build` emits the single bundled `dist/index.js`

TypeScript strict, ESM, **extensionless source imports** (entity_pages' convention,
not the `.js`-suffixed one most of the family uses). Published to npm (restricted)
via CI on push to main. Everything exports from `src/index.ts` (package-root import only).

## Architecture rules

- Every score mutation goes through a `ScoreCommand` (music_types' `domain/commands/`)
  via the store's `dispatchCommand` (music_editing's `score-slice`); commands are pure.
- Ticks are integers (480 PPQ default); never floating-point seconds in the timeline.
- VexFlow/player objects never live in Zustand (renderer in refs, player in music_player's singleton).
- Voices correlate across measures by ordinal index in `measure.voices`, not voice id.

## Gotchas

- **This package is platform-free; five guard tests keep it so**
  (`src/platform/no-platform-imports.test.ts`): no `tone`/`@tonejs/midi`, no
  platform runtime dep, no web-only global outside the canvas renderer, no
  `import.meta`, no `Worker`. Runtime deps are exactly `music_codecs`,
  `music_drawing`, `music_player` (through **`/core` only** — the root entry
  constructs a synth), `immer`, `zod`. The guards grep raw source (comments
  stripped), because every test runs in jsdom where the offending import works —
  the breakage only appears in a React Native bundle.
- **`import.meta` is syntax, not a value** — RN's bundler transforms to CommonJS
  where it has no meaning, so a module using it fails to *parse*. Anything
  environment-shaped is injected by the app (`setErrorLogging` for dev console output).
- **One fact, one declaration** (`src/__single-source.test.ts`): a constant
  restated in a second package drifts silently. The guard reads the name list from
  music_types at runtime; its `ALLOWED` list is empty on purpose. A closed
  vocabulary is a `const [...] as const` array with the type read off it; a list
  keyed by it is a `Record<T, …>`, never a parallel array.
- **Vocabulary and types are music_types', not declared here**
  (`src/__moved-to-types.test.ts`). This package re-exports music_types et al.
  wholesale, so re-declaring one name reaches consumers by two routes — a TS2308
  here and a "Cannot redefine property" crash in a CommonJS consumer.
- **Both playback plans are music_player's** (`renderEvents`/`playbackPlan`/
  `playbackTracks`/`resolveVoice`, exported from its `/core`). Neither music_player
  nor music_io depends on anything here — a contract test in each enforces it — so
  anything an engine needs must be resolved into the plan first.
- **`ScoreCommand.kind` is `'content' | 'mix'`, required.** The edit lock
  (music_editing's `score-slice`) refuses a content command while the transport
  plays; mix (volume/pan/mute/solo) is exempt and reaches the engine live via
  `applyMix`. `IMusicPlayer.load` has exactly two branches: playing →
  `applyMix(tracks)`, no reload; otherwise build a plan and load it. The no-reload
  branch is sound only because a content change cannot have happened — **if the
  lock is ever loosened, the old stop-reload-seek-resume code must come back.**
  `services/playback/adapter.ts` relies on this.
- **Playback is bound by an adapter** (`services/playback/adapter.ts`): it keeps
  everything that reads/writes editing state (score subscription, visible tracks,
  selection, caret) and composes score/selection-aware ops (`togglePlay`,
  `seekToMeasure`, `setLoopFromSelection`) over the player's primitives. The
  engines/transport/plan-building moved to music_player. The controller is a
  module-level singleton constructing objects at import — **consuming apps' component
  tests must mock it.**
- **Autosave omits the score when it hasn't changed** — `project-slice` keeps the
  last-saved score by identity (a command returns a new object), so a prefs-only
  save sends `{name, uiPrefs}`. A write returns `ProjectSaveResult`, not a record.
- **`serverUpdatedAt` lets a client recognise its own writes** — a poller comparing
  only its own last observation reads every autosave as a foreign change. A write
  that bypasses the autosaver must call `noteServerVersion`.
- **Theme, developer mode and `devSettings` are device prefs**
  (`createDevicePrefsSlice`), not the editing ui slice; `EDITING_PREF_KEYS` is just
  `['pitchDisplay']` (note entry reads it), so a document store has no theme.
- **Tests use `@sudobility/music_io/mocks`, never `music_io/web`** — the web entry
  imports this package, pulling its own published dist back in.
- **No highlight overlay, no workers, by decision.** Note state is the notehead's
  own colour (`noteColors` + `activeTrackId` into `CanvasScoreRenderer.render`).
  The offload workers were deleted after measuring `quantizeEvents` at 0.57ms vs a
  structure-clone of the whole event array; `importMidiFile`/`analyzeMidiFile`
  survive as the pure `MidiFile`-in seam.

## Structure

- `src/store/` — `useAppStore.ts` (`createAppStore`/`initializeAppStore` composes
  music_editing's slices with these), `document-store.ts` (`createDocumentStore`,
  one store per document), `slices/` (generation, playback, project), `context.ts`.
- `src/services/` — `playback/` (`adapter.ts`, `bind-player.ts`), `prefs.ts`
  (device prefs + `resolveThemeMode`), `export/export-plan.ts`,
  `documents/unsaved-guard.ts`, `docs/` (`DOCS_TOPICS`, `RESOURCE_GROUPS`),
  `generation/`, `persistence/`, `import/`, `errors.ts`, `messages.ts`, `library-copy.ts`.
- `src/templates/` — deterministic starter scores. `src/test/` — fixtures and
  `canvas-stub.ts` (`createMock2DContext`, exported from the root for consumers' jsdom suites).

## Related

`music_types` (types/schemas) · `music_client` (network) · `music_api` (backend) · `music_app` (web UI)
