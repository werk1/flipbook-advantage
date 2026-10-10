# flipbook App Integration Contract

Status: generated from cloned/file snippet
Module: `flipbook`
Package: `@werk1/w1-system-flipbook`
Snippet version: `2026-10-08`
Snippet source: local generated contract snapshot
Package integration: `file: sibling package`

## Local Contract Snapshot

The following content was copied into this app during generation so the app remains standalone.

# Flipbook App Integration Snippet

Snippet-Version: 2026-10-08
Status: current (roadmap step G4)

This file is the package-owned integration snippet that `w1-system-app-creator`
embeds as `docs/contracts/flipbook-app-integration-contract.md` into generated
apps with module `flipbook` active.

## Owning Package

- `@werk1/w1-system-flipbook` — headless, prepared-data flipbook viewer
  (`W1FlipbookBlock`, `W1FlipbookInput`, `W1FlipbookConfig`, `W1FlipbookPage`).

## App-Owned Surface

- Payload collection `flipbooks` (`src/payload/collections/Flipbooks.ts`):
  PDF upload via `media`, conversion status, ordered page list.
- Module-neutral reader hook on `flipbooks`, written by other modules (pdfedit
  "PDF aktualisieren"): `pageOverrides[]` (`pageIndex`, `image`, `width`, `height`),
  `pdfOverride`, `overrideRevision`, `overrideSource`, `overrideManifestUrl`,
  `overrideManifestFor`. The reader shows the overrides only while
  `overrideRevision` equals `publishedRevision`. The manifest it passes on
  (`manifestUrl` of `W1FlipbookInput`: text layer, links) is the conversion's
  `manifestUrl` without active overrides, and with active overrides
  `overrideManifestUrl`, but only while `overrideManifestFor` names the current
  `pdfOverride` (else none). Without such a module the fields stay empty.
- Conversion queue and admin endpoint
  (`src/app/(payload)/api/flipbook-convert/` + `src/lib/flipbook/`):
  in-process serial queue (no persistence; aborted or failed conversions end
  in `error` and are restarted by an admin), server-side PDF-to-page-image
  rendering (`pdftoppm`/poppler-utils plus fontconfig and base fonts in the
  Docker image), WebP sizes via the `media` upload config, delayed cleanup of
  superseded revisions. Assumes a single app instance.
- Neutral `media` extensions: `application/pdf` MIME, `generatedBy`/
  `generatedFor`/`generatedRevision`/`generatedReleasedAt` fields and a delete
  guard for referenced flipbook PDFs, published pages and uploaded covers.
- Payload block `w1-flipbook-block`
  (`src/payload/blocks/FlipbookSection.ts`) with `flipbookSlug` and per-section
  config overrides.
- Resolver `src/lib/blocks/flipbook/resolveFlipbookBlockInput.ts`: maps a
  `flipbooks` document to `W1FlipbookInput`.
- Section renderer `src/components/page/W1FlipbookSectionRenderer.tsx` and its
  registration in `PageSectionComponents`/`resolvePageSections`.
- Frontend routes `src/app/(frontend)/flipbooks/` (listing) and
  `flipbooks/[slug]` (fullscreen reader, canonical deep link for external
  references). The start page `/` is the flipbook host: header bar with a
  menu of all published flipbooks, first entry open by default,
  `?book=<slug>` selects another book.
- Cover selection on the `flipbooks` document (page 1 by default, another
  page or an uploaded image), resolved into `coverImage` for listing and OG
  image.
- `next.config.mjs` `headers()`: `Cache-Control: public, max-age=43200` for
  generated page images, chunks and manifest (`/api/media/file/fb-*`); the
  cache time stays below the 24 h retention of superseded revisions, which
  counts from their replacement.
- Conversion renders pages ahead in parallel (`FLIPBOOK_RENDER_CONCURRENCY`,
  3 `pdftoppm` processes) and creates the page media in page order; jobs
  themselves stay serial. Text/style extraction times out after 5 min.
- Reader and section lookups (`loadPublishedFlipbook`) exclude the
  server-only `textModel`/`imageModel` and match the slug lowercase; the
  search route loads the text model only when it builds its index.
- Page `srcSet` adds the original image when it is wider than every
  generated size; `labels.pdfLinkPage` names internal PDF links.
- Viewer switches per flipbook in `defaultConfig` (checkboxes, from
  `FLIPBOOK_BOOLEAN_CONFIG_KEYS`; default on, page sections cannot override
  them): `allowSearch` — the search with its page highlights;
  `allowTextSelect` — the text-select mode (selecting and copying page text
  from the PDF text layer of the manifest), the only way to copy text in the
  reader. The PDF download stays either way.
- The search route answers each hit with the hit block (`rect`) and the
  rects of its matched words (`marks`, found with pdfedit
  `createTermMatcher` in the block's word boxes of the text model); a block
  whose text an override replaced has no word boxes to match and is
  highlighted as a whole.
  Admins keep both: the reader route, the start page and page sections pass
  `withAdminFeatures(input, isAdminRequest(…))`
  (`src/lib/blocks/flipbook/viewerAccess.ts`). The search route enforces
  `allowSearch` on the server (404 for everyone but admins, so the reader's
  probe shows no search); admin answers are `Cache-Control: private, no-store`.

## Generated App Wiring

- Module `flipbook` in the App Creator copies the files above from
  `flipbook-system` (`flipbookSystemCopy`). The base `Media.ts` (generatedBy*
  fields, flipbook delete guard) and the reader styles in `global.css` still
  come from the core-v2 base copy. The App Creator gates
  `Pages.ts`, block/collection indexes, `payload.config.ts` (collection +
  `onInit` reset), page types/model/resolver/components and
  `next.config.mjs` on `hasFlipbook`.
- Runtime tools (`poppler-utils`, `fontconfig`, `font-dejavu`,
  `font-liberation`) are installed in `Dockerfile`, `docker/dev/Dockerfile`
  and — through `w1RuntimeApk` in `package.json` — in the autodeploy image
  (`autodeploy/multi/Dockerfile_Multi`).
- `src/payload/collections/Media.ts` stores files under `MEDIA_STORAGE_ROOT`;
  the conversion reads and writes through the `media` collection, never a
  fixed `public/media` path.
- Operation: one app instance per deployment, 500 MB / 300 pages per PDF,
  reverse proxy upload limit ≥ 500 MB, `W1_FLIPBOOK_RETENTION_HOURS` (24).

## Package-Owned Surface

- Page-flip rendering with the package's own engines: WebGL mesh-curl
  (three.js, lazily loaded) or DOM "Strip-Curl" fallback — selected via
  `config.engine` (`'auto'` default) with automatic strip fallback without
  WebGL 2; GSAP animation, `w1-system-gsap-gesture` drag, no external flip
  library, no `extraNpm`. Spread/cover/direction handling, controls, thumbnails, zoom,
  fullscreen, keyboard/swipe navigation.
- The `W1FlipbookInput`/`W1FlipbookConfig` contracts — app code passes prepared
  page-image data; the package never queries Payload or app routes.

## Usage

```tsx
import { W1FlipbookBlock, type W1FlipbookInput, type W1FlipbookLabels } from '@werk1/w1-system-flipbook'

<W1FlipbookBlock input={input} labels={labels} deviceInfo={deviceInfo} />
```

Register GSAP plugins centrally in the app before rendering. Map app theme
tokens to the `--w1-flipbook-*` variables (see the public API contract) or pick
`theme: 'light' | 'dark'`.

## Working Rule

Viewer bugs and rendering behavior belong in this package. Upload,
conversion, collection schema, routes and admin UI belong in the app host.
Do not import app internals (`@/payload-types`, `@/stores`, route files) from
the package.
