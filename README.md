# Laccite

Laccite is a local-first texture project manager and editor for PPSSPP texture packs.

## Local development

```sh
cd studio
npm ci
npm run dev
```

Create a production build with `npm run build` from `studio/`. The generated site is written to `studio/dist/`.

## Deploy with Vercel

Connect this repository to Vercel and deploy from the repository root. The root `vercel.json` installs dependencies and builds the Vite app in `studio/`; no prebuilt HTML or ZIP upload is required.

Project data is stored in the browser's IndexedDB. A deployment serves the app but does not synchronize projects between browsers or devices.

Project notes, checklists, and file notes are stored with the project in IndexedDB and included in full-project ZIP exports. File notes follow resources when they are renamed or moved; notes for removed resources remain archived.

See [docs/ORGANIZATION.md](docs/ORGANIZATION.md) for the repository layout and guidance on where to add or move files.
