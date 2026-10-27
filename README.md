<div align="center">

# 🔲 Cellular Rule Studio

**A small rule, a growing pattern.**

![Vue](https://img.shields.io/badge/Vue-3-42b883?style=for-the-badge&logo=vuedotjs&logoColor=ffffff)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=ffffff)
![Vite](https://img.shields.io/badge/Vite-8-646cff?style=for-the-badge&logo=vite&logoColor=ffffff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=ffffff)
![License](https://img.shields.io/badge/License-MIT-777777?style=for-the-badge)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

_Vue cellular automaton studio with a typed render-function grid, editable seed bits, finite boundaries, and SVG/PBM/TXT/JSON exports._

</div>

---

## ✨ Highlights

- **All 256 rules:** Inspect the eight three-cell neighborhoods and their next values.
- **A finite experiment:** Keep an 8–64-cell seed and 1–64 rows, including the seed.
- **Two boundaries:** Join both ends or treat outside neighbors as zero.
- **Vue render function:** Build accessible SVG nodes with h, typed props, computed geometry, and unique IDs.
- **Compact graphics:** Merge consecutive on cells into horizontal SVG path runs.
- **Atomic forms:** Validate rule/seed candidates while preserving unrelated pending fields.
- **Real bitmap delivery:** Download plain P1 PBM, colored SVG, complete row TXT, or canonical CA JSON.

## 🧱 Project Structure

```text
public/
├── favicon.svg                         # Original project emblem
├── og.svg                              # Original social artwork
├── font-licenses.txt                   # Font copyright and OFL licenses
└── sample-workspace.json               # Complete importable workspace
src/
├── components/
│   ├── AutomatonGrid.ts
│   ├── DataTools.vue                   # Workspace actions and restoration
│   ├── AppDialog.vue                   # Native Teleport modal and focus lifecycle
│   ├── AppIcon.vue                     # Original inline SVG icons
│   ├── DataExchange.vue                # Validated workspace import dialog
│   └── StudioHeader.vue                # Workspace branding and actions
├── domain/
│   ├── automaton.ts                   # Pure validation, calculations, and exports
│   ├── shared.ts                       # Text, number, and provenance helpers
│   └── validation.ts                   # Strict unknown-input guards
├── services/
│   ├── draft.ts                        # Validated device-local persistence
│   └── files.ts                        # Downloads and deterministic identities
├── App.vue                             # Workspace and editor state
├── base.css                            # Tailwind, local fonts, and control defaults
├── style.css                           # Project theme tokens
└── main.ts                             # Vue application entry
tests/
├── *.test.ts                           # Native domain/composable/export tests
└── e2e/                                # Production browser workflows
```

Root files include Vite, TypeScript, Playwright, and Prettier configuration, an npm lockfile, the MIT license, and explicit `vercel.json`. The official scaffold’s default artwork and empty `src/assets` directory are removed. The shared generic development container stays unchanged.

## 🛠 Tech Stack

| Tool                          | Role                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| Vue 3.5                       | Typed SFCs, component contracts, reactive state, and lifecycle management   |
| TypeScript 6                  | Checked domain structures and component/composable inputs                   |
| Vite 8                        | Development server and static production bundles                            |
| Tailwind CSS 4                | Vite plugin, theme tokens, template utilities, and responsive/state styling |
| DM Sans + Bricolage Grotesque | Locally bundled Latin variable fonts                                        |
| Node.js 24+                   | Local CLI tools and native TypeScript tests                                 |
| Playwright                    | Chromium workflows against the production build                             |

The app requires no account, backend, remote data source, or extra UI library. All dependencies and CLI tools are installed locally inside this independent project.

## 🎨 Tailwind Styling

The Vite config enables `@tailwindcss/vite`. `base.css` imports Tailwind, defines font tokens, and uses `@apply` for small native control defaults. `style.css` defines project colors through `@theme`. Actual application templates use Tailwind utilities for grid/flex layouts, spacing, typography, borders, colors, responsive behavior, focus, and visible states.

`data-ui`, `data-project`, and domain identity attributes are explicit browser hooks. There are no orphan semantic styling classes. Reserved preview/list containers and internal overflow keep neighboring panels stable when modes, selected details, or results change. All application layout and visible-state classes use Tailwind utilities. Native SVG attributes describe domain geometry and colors; Standalone exported graphics carry their own presentation. Reduced-motion preferences shorten transitions.

Two Fontsource variable font files are bundled as hashed local assets. Their copyright and OFL text are in [font-licenses.txt](./public/font-licenses.txt). Favicon/social artwork and SVG interface icons are original project assets.

## 📦 Included Demo Data

The original **A little triangle of surprises** starts from a single centered one in a 31-cell seed. Rule 30 generates 32 rows with wrapping boundaries and a soft violet ink. Row one is the seed, rather than an additional uncounted generation.

The complete [sample-workspace.json](./public/sample-workspace.json) includes valid provenance and is served as a public static file. The application imports this same JSON sample for first use and confirmed restoration.

## 🚀 Local Development

Use Node.js **24 or later**:

```bash
npm ci
npm run dev
```

Vite prints the local URL and binds to `0.0.0.0` for the shared container. Inspect a production bundle with:

```bash
npm run build
npm run preview
```

## 🧩 Vue Implementation

AutomatonGrid is a typed Vue component written with [defineComponent and a render function](https://vuejs.org/guide/extras/render-function.html). Its setup creates unique title/description/pattern IDs and a computed trajectory. The returned function builds SVG VNodes through h: accessible metadata, a white background, merged filled runs, and a light cell guide. Vue patches the existing SVG when inputs change; no user string is inserted as HTML.

The pure [elementary cellular automaton](https://mathworld.wolfram.com/ElementaryCellularAutomaton.html) reads left/current/right cells from the previous row. The neighborhood index is 4×left + 2×current + right; the corresponding rule bit gives the next cell. Every cell advances synchronously. The display table runs from 111 down to 000, matching the rule's eight-bit representation.

Wrapping uses modulo width for both edge neighbors. Empty outside supplies zero. The finite width and boundary are deliberate inputs, so later rows can differ from an infinite-field illustration. Row count includes the seed, including the valid one-row case.

runPath combines each consecutive horizontal sequence of ones into one unit-high closed rectangle path. The preview adds only a faint guide; exported SVG has a white background and the complete colored run path. Its default dimensions are ten pixels per cell with a one-unit-per-cell view box.

The [plain PBM export follows the Netpbm P1 specification](https://netpbm.sourceforge.net/doc/pbm.html): ASCII dimensions and zero/one pixels, with one meaning black. Raster tokens wrap in groups of 32 to stay within the 70-character line limit. Its fixed ASCII provenance comment does not insert user names into the format. Browser tests independently rasterize the downloaded SVG and compare every pixel to the actual PBM.

Rule and seed forms have separate value-based synchronization. Toggling the applied seed replaces only its bits and preserves pending rule fields. Applying unrelated settings preserves pending seed text. Import/restoration explicitly refresh both forms. Grid/row views use a reserved frame and preserve the render-function SVG instance.

The shared modal uses `Teleport`, a unique `useId` heading, and a post-flush watcher to synchronize Vue state with native `showModal`/`close`. Escape and focus return remain native. A queued close event cannot reset a modal that has already reopened.

## 💾 Local Drafts & Data Exchange

Validated workspace data is stored under `vue-cellular-rule-studio:v1`. First-use and restored data are validated before use. Invalid saved JSON/schema falls back to the sample without immediately overwriting the damaged entry. A later valid change writes a new draft. Blocked storage leaves editing and downloads usable and shows a status message.

Import parses a detached candidate and replaces the workspace only after complete validation. Failure keeps current work and the saved draft intact. Workspace JSON is limited to **120,000 characters**. Known fields are rebuilt in canonical order; unknown fields and supplied provenance are not trusted or carried into the editable domain. Project markers are recomputed from validated data. Workspace name, rule, row count, boundary, exact seed string, and ink are persisted. Width is derived from the seed. Grid/row view, pending fields, dialogs, trajectories, and SVG paths are transient.

| Field         | Accepted values                                               |
| ------------- | ------------------------------------------------------------- |
| version, name | 1; nonblank single-line title up to 80 characters             |
| rule          | Actual whole integer 0–255                                    |
| rows          | Actual whole integer 1–64, including the seed                 |
| boundary      | wrap or empty                                                 |
| seed          | Exactly 8–64 characters, each 0 or 1; its length is the width |
| ink           | Six-digit HEX canonicalized uppercase                         |

Seed strings are strict, without whitespace removal or implicit resizing. Zero-only seeds and rules 0/255 are valid. Wrong primitives, fractions, excessive/empty dimensions, malformed bits/colors, unsupported boundaries, and unsupported versions reject candidates. Derived rows and rendered paths are not stored.

SVG keeps the full escaped name/description, original color, every cell run, white background, and CA attribution, without the editor guide. PBM is an actual plain P1 monochrome bitmap with exact dimensions/pixels and short ASCII lines; it maps ones to black regardless of saved ink. TXT includes full name/marker, inputs, complete neighborhood table, and every numbered bit row. JSON stores the editable seed/rule/row/boundary/color inputs and canonical provenance.

Download Blob URLs are revoked after download. Sample restoration uses a native confirmation dialog.

## ◈ Project Markers

- `CA` appears in the wordmark, project metadata, and workspace identity; original favicon/social artwork use a matching emblem.
- `CA-XXXXXXXX` is a deterministic 32-bit content stamp calculated with FNV-1a over the UTF-8 canonical workspace JSON, excluding supplied provenance.
- JSON provenance includes the project slug, `CodeSculptor`, and the marker. Downloaded artifacts carry the appropriate identity in filenames and/or metadata/content.
- Markers help identify configurations and artifacts; they are not cryptographic signatures or tamper-proof authorship claims.
- Author metadata and the MIT license retain CodeSculptor attribution.

## 🧭 Extension Notes & Nuances

- One-dimensional, two-state, nearest-neighbor elementary rules only; no two-dimensional Life, random initialization, infinite field, animation, or external bitmap import.
- Width comes from the seed string. Resizing is an explicit bit-string edit, rather than silently dropping or adding cells.
- One row means the initial seed only. Every further row is one synchronous update.
- Boundary behavior affects finite-field results; a wrapping experiment is not an infinite-field proof.
- SVG uses a selected ink, including white if requested. PBM is always black/white and does not preserve color.
- PBM is P1 text, not packed P4 bytes, PNG, or a renamed text report. Some image viewers require conversion with a compatible PBM tool.
- Grid/row view, pending fields, dialogs, trajectory arrays, and run paths are transient.
- Extend rule indexing, boundaries, raster dimensions, run merging, and SVG/PBM comparison together.

The application and documentation are English. At 320 px panels stack, while larger screens use the shared grid. Scrollable data regions, named native controls, visible focus styles, and a single main landmark remain available across layouts.

## ✅ Build & Checks

```bash
npm run build
npm run format:check
npm test
npx playwright install chromium
npm run test:e2e
```

`build` runs `vue-tsc` before Vite. Native tests use Node’s built-in runner. Playwright starts the current production bundle with the local preview command and does not reuse another server. Build before browser tests so they inspect current output. `npm run format` formats maintained source; dependencies, generated output, lockfiles, and browser artifacts are excluded.

Six native tests cover known Rule 30 rows, every one of 256 rules across all eight neighborhoods, boundary/constant/copy cases, exact merged-run cell coverage, strict schema fields, maximum PBM ASCII/token/line bounds, escaped reports, and Unicode marker coverage. Four browser workflows cover real render-function DOM/color/path updates, pending fields/persistence, seed/boundary failures and stable views, independent SVG-to-PBM raster comparison, actual complete TXT downloads, and all-zero/all-one outcomes.

Shared browser workflows check valid/failed imports, persistence after reload, provenance downloads, blocked/corrupt storage, confirmed sample restoration, native modal reopening/Escape/focus, real Tailwind grid behavior, named visible controls, and overflow at 320–1440 px. A maximum 64×64 escaped workspace downloads and re-imports completely at 320 px. These are local production checks, not a deployed Vercel smoke test.

## ▲ Vercel Deployment

1. Import the repository and select this project folder as the Root Directory when deploying from the shared workspace.
2. Use the committed config: `npm ci`, `npm run build`, and output folder `dist`.
3. Check the root page, public sample/artwork, and main editor after deployment.

The explicit `vercel.json` rewrites only `/` to `/index.html` and permanently redirects `/index.html` to `/`. There are no client routes requiring a catch-all rewrite. Declared routes preserve missing-resource behavior. HTML and unhashed public files revalidate; Vite’s hashed JS/CSS/font assets receive one-year immutable caching. All responses include `X-Content-Type-Options: nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`. The dev command accepts Vercel’s `$PORT` with `--strictPort`.

Used fields, route compilation, and generated asset/cache behavior are checked locally against the [official Vercel configuration schema](https://openapi.vercel.sh/vercel.json). Vite preview does not emulate deployment headers. SVG social artwork is included as an editable source; platforms requiring raster cards need a rendered image and an absolute deployed image URL.

## 📄 License

[MIT](./LICENSE) · Copyright (c) 2026 **CodeSculptor**. Bundled fonts retain separate OFL licenses.
