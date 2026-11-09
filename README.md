# @sudobility/music_lib

Platform-free business logic for the Moosiac / ScoreSmith music-app family.
It sits **above editing**: the composed application store (web) and per-document
stores (native), autosave and project writes, the editing↔playback binding
(`bindPlayer`) and playback adapter, export planning (`planExport`), the
unsaved-work guard, docs/resource content, generation request builders and
credits, device preferences (theme, developer mode, keyboard, font size,
language), starter-score templates, and the shared route registry.

It carries **no platform code** — no audio engine, no notation renderer, no DOM,
no workers — so the same store composes on web and React Native (enforced by
`src/platform/no-platform-imports.test.ts`). The score model, commands, closed
vocabularies and schemas live in `@sudobility/music_types` and are re-exported
from this package's root, so apps import them from here too.

## Installation

`@sudobility/*` packages are published to **GitHub Packages**, so configure the
scope registry first (an `.npmrc` with `@sudobility:registry=https://npm.pkg.github.com`
plus an auth token with `read:packages`), then:

```bash
bun add @sudobility/music_lib
```

The `@sudobility/music_*`, `@sudobility/routing`, `immer` and `zustand` packages
listed under `peerDependencies` must also be installed by the host app.

## Usage

Everything is exported from the package root (no subpath imports).

```ts
import {
  // app store + binding
  createAppStore,
  useAppStore,
  createDocumentStore,
  bindPlayer,
  // services
  planExport,
  buildReplaceSubmission,
  createEmptyScore, // re-exported from music_types
  validateScore,    // re-exported from music_types
} from '@sudobility/music_lib';
```

The notation renderer lives in `@sudobility/music_drawing` and the audio engines
in `@sudobility/music_player`; hosts compose those alongside this package.

## What's Inside

- **App/document store** — Zustand stores composing `music_editing`'s slices with
  generation / playback / project slices here; one app-wide store on web
  (`createAppStore`/`useAppStore`), one store per document on native
  (`createDocumentStore`).
- **Persistence** — autosave, project writes, project-UI prefs.
- **Playback binding** — a score/selection-aware adapter over `music_player/core`'s
  pure plan builders (`togglePlay`, `seekToMeasure`, `setLoopFromSelection`).
- **Services** — export planning, generation request builders + credits, MIDI
  import options, the unsaved-work guard, docs/resource content, device prefs.
- **Templates** — deterministic starter scores.
- **Routing** — the framework-agnostic route registry both apps bind to.

## Development

```bash
bun install
bun run verify   # format:check + typecheck + lint + test:unit (220) + build
```

Other scripts: `bun run test:unit` / `test:watch` (Vitest + jsdom),
`bun run typecheck` (`tsc --noEmit`, the type gate), `bun run lint`,
`bun run build` (Vite emits a single bundled `dist/index.js` + types).

Published to GitHub Packages via CI (`.github/workflows/ci-cd.yml`) on push to
`main`.

## License

BUSL-1.1
