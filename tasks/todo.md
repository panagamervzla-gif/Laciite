# Tasks: zoom independiente del Inspector de imágenes

## Phase 1: Zoom model

### Task 1: Define and test zoom calculations, input validation, bounds, and fit-to-stage behavior

- [x] Create the smallest pure helper for zoom clamping, stepping, percentage parsing, and fit-to-stage scale.
- [x] Test min/max bounds, invalid and empty input, increment/decrement, and fit calculations for landscape/portrait images and constrained viewports.
- **Acceptance:** zoom rules are independent of DOM and browser page zoom; malformed input cannot produce an invalid scale.
- **Verify:** `npm --prefix studio test -- image-zoom.test.ts`.
- **Dependencies:** None.
- **Files likely touched:** `studio/src/app/image-zoom.ts`, `studio/src/app/image-zoom.test.ts`.
- **Estimated scope:** Small.

## Phase 2: Inspector controls and rendering

### Task 2: Add accessible Inspector controls and apply zoom only to its image stage

- [x] Add **−**, editable percentage, **+**, and **Ajustar** controls to the Inspector toolbar.
- [x] Wire controls to the tested zoom model and scale only the Inspector image; keep path, dimensions, format and file size unchanged.
- [x] Make an opened image start in Fit mode; preserve manual zoom on viewport resize, and recalculate only while in Fit mode.
- [x] Hide scrollbars and allow panning of oversized images with mouse drag and keyboard arrows, without page-level scrolling or browser page zoom changes.
- **Acceptance:** controls are keyboard-operable and labelled; values stay within the agreed limits; the page and surrounding UI do not zoom; the Inspector remains usable on narrow screens.
- **Verify:** focused tests, `npm --prefix studio test`, `npm --prefix studio run build`, then manual browser checks.
- **Dependencies:** Task 1.
- **Files likely touched:** `studio/index.html`, `studio/src/app/main.ts`, `studio/src/app/image-inspector.css`; add a focused view test only if it can follow existing project patterns.
- **Estimated scope:** Medium.

### Task 3: Verify zoom interactions and responsive behavior

- [x] Check plus/minus, direct percentage entry, invalid/out-of-range values, Fit reset, mouse drag, and keyboard arrows in DOM tests.
- [ ] Check large and small landscape/portrait images, panning in both axes, and narrow viewport layout in a real browser (unavailable here).
- [x] Test image reset and resize behavior in Fit and manual-zoom modes.
- **Acceptance:** displayed percentage matches the rendered scale; Fit contains the whole image; manual zoom is independent from page zoom; image switching and viewport resizing follow the stated state rules.
- **Verify:** focused tests and `npm --prefix studio run build` pass; Chrome DevTools MCP and a local browser executable are unavailable, so interactive browser validation remains pending.
- **Dependencies:** Task 2.
- **Files likely touched:** feature files from Task 2 only, unless a test exposes a tightly related issue.
- **Estimated scope:** Small.

## Phase 3: User documentation

### Task 4: Document Inspector zoom and update the private inventory

- [x] Add `.local/function-docs/function-zoom-inspector-image.md` using `TEMPLATE.md`.
- [x] Update `function-inspect-image.md` to mention the zoom controls and preserve its metadata coverage.
- [x] Update `.local/function-docs/README.md` to list the new operation and change the active count from 41 to 42.
- **Acceptance:** exactly 42 current operations are indexed once; new page sections and internal links are valid; mark browser verification accurately.
- **Verify:** check all `function-*.md` links, required sections and count.
- **Dependencies:** Task 2; browser-check status from Task 3.
- **Files likely touched:** `.local/function-docs/README.md`, `.local/function-docs/function-inspect-image.md`, `.local/function-docs/function-zoom-inspector-image.md`.
- **Estimated scope:** Small.

## Checkpoint: Inspector zoom ready for review

- [x] Focused and complete test suites pass.
- [x] Production build succeeds.
- [x] Browser acceptance limitation is explicitly recorded.
- [x] Private inventory count and links are correct.
- [x] User approved implementation before work began.
