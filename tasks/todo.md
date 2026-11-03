# Tasks: edición de varias texturas en Photopea

## Phase 1: Protocol foundation

### Task 1: Add Vitest/jsdom and implement a testable Photopea session registry — done

- [x] Add Vitest and jsdom as development dependencies and configure `npm test`.
- [x] Create the small typed session registry for opaque document ID, origin project/path, output format/MIME and original content hash.
- [x] Add unit tests for document registration, lookup, completion and stale-session handling.
- **Acceptance:** the registry has no DOM, Photopea iframe or IndexedDB dependency; its tests pass.
- **Verify:** `npm test`; `npm run build`.
- **Dependencies:** None.
- **Files likely touched:** `studio/package.json`, `studio/package-lock.json`, `studio/vitest.config.ts`, `studio/src/photopea/photopea-session.ts`, `studio/src/photopea/photopea-session.test.ts`.
- **Estimated scope:** Medium.

### Task 2: Reuse the iframe and open sequential documents through native Photopea tabs — implemented; browser verification pending

- [x] Initialize the iframe only for the first image; send later images as `ArrayBuffer` messages without reloading it.
- [x] Serialize open operations and assign each opened document its opaque `Document.source` after Photopea confirms the binary was processed.
- [x] Keep navigation through Gestor and Inspector, and make the Laccite editor toolbar describe the multi-document editor without claiming a stale active filename.
- **Acceptance:** opening two different textures results in two Photopea documents in the same iframe, and both remain available using Photopea's native tabs.
- **Verify:** focused session tests, `npm run build`, and manual opening/alternation in the browser.
- **Dependencies:** Task 1.
- **Files likely touched:** `studio/src/app/main.ts`, `studio/index.html`, `studio/src/photopea/photopea-session.ts`, `studio/src/photopea/photopea-session.test.ts`.
- **Estimated scope:** Medium.

### Checkpoint: Open multiple documents

- [x] `npm test` passes.
- [x] `npm run build` succeeds.
- [ ] The actual Photopea editor confirms the expected ready/open/source-assignment message sequence.
- [ ] No prior document is lost when opening the next texture.

## Phase 2: Correct and safe persistence

### Task 3: Route active-document saves to the source project and reject stale files — implemented

- [x] Have both Laccite's save button and Photopea's configured Save action identify and export the active Photopea document with that document's format.
- [x] Resolve the source project and exact path independently of the currently active Laccite project.
- [x] Compare the stored file's current hash to the version loaded for that document; reject missing, deleted, moved, renamed or changed sources without writing.
- [x] Refresh visible project state only when the saved source project is currently active.
- **Acceptance:** saves target the correct project/file; invalid or stale sessions produce an explicit status and no write.
- **Verify:** automated tests for source-to-file routing, per-document formats, wrong-origin/unknown IDs, project switching, missing sources and stale hashes; `npm run build`.
- **Dependencies:** Task 2.
- **Files likely touched:** `studio/src/app/main.ts`, `studio/src/photopea/photopea-session.ts`, `studio/src/photopea/photopea-session.test.ts`.
- **Estimated scope:** Medium.

### Task 4: Verify multi-document save behavior in the browser

- [ ] Open two textures from one project and one texture from a second project in the same Photopea iframe. The local server responds at `http://localhost:5173/`; interactive browser tooling was unavailable during implementation.
- [ ] Switch among Photopea's native tabs and save each document; confirm the correct IndexedDB project/file changes.
- [ ] Verify PNG and JPEG output formats, and verify deleted or modified source files are rejected with a visible message.
- [x] Run the complete focused suite and production build; update the spec if observed Photopea behavior requires a change.
- **Acceptance:** every manual scenario matches the specification and no cross-document or cross-project write occurs.
- **Verify:** `npm test`, `npm run build`, and browser testing at `http://localhost:5173/`.
- **Dependencies:** Task 3.
- **Files likely touched:** no code expected; any required fix is limited to the feature files from Tasks 1-3.
- **Estimated scope:** Small.

### Checkpoint: Ready for review

- [x] All automated tests pass.
- [x] Production build succeeds.
- [ ] Browser acceptance scenarios pass.
- [ ] Spec and task list reflect any approved scope changes.
