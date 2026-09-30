# W1 System – Generierungs-Report

**Generiert am:** 2026-09-30 12:00:56 UTC

---

## 1. Projektkonfiguration

| Feld | Wert |
|---|---|
| Projektname | `flipbook-advantage` |
| Zielverzeichnis | `/media/win_d/programming/W1_SYSTEM/flipbook-advantage` |
| Beschreibung | Advantage PDF flipbook |
| Docker Registry | `reg.werk1.at` |
| Image | `flipbook-advantage` |
| Repo URL | `git@werk1.github.com:werk1/flipbook-advantage.git` |
| Git Branch | `main` |
| GitHub Org | `werk1` |
| SSH Host | `–` |
| SSH User | `–` |
| SSH Port | `22` |
| SSH Dir | `–` |
| APP_PORT | `3601` (externer Container-Port; steht in `.env.example` und als Default in `docker-compose.yml` / `docker-compose.dev.yml`) |

---

## 2. Ausgewählte Module

### 2.1 Direkt ausgewählt

- **`flipbook`**

### 2.2 Automatisch aufgelöste Abhängigkeiten (Auto-Deps)

_(keine)_

### 2.3 Alle aktiven Module

- `flipbook`

---

## 3. Installierte Pakete

### Paket-Integration

| Modus | Pakete |
|---|---|
| **Workspace** (file:../, lokal vorhanden) | w1-system-device-info, w1-system-gsap-gesture, w1-system-gsap-scroll, w1-system-timeline-engine, w1-system-imageblock, w1-system-media-manager, w1-system-carouselblock, w1-system-font-manager, w1-system-flipbook |

### 3.1 @werk1-Pakete – Geklont (dependencies)

- `@werk1/w1-system-device-info` → `file:../w1-system-device-info`
- `@werk1/w1-system-gsap-gesture` → `file:../w1-system-gsap-gesture`
- `@werk1/w1-system-gsap-scroll` → `file:../w1-system-gsap-scroll`
- `@werk1/w1-system-timeline-engine` → `file:../w1-system-timeline-engine`
- `@werk1/w1-system-imageblock` → `file:../w1-system-imageblock`
- `@werk1/w1-system-media-manager` → `file:../w1-system-media-manager`
- `@werk1/w1-system-carouselblock` → `file:../w1-system-carouselblock`
- `@werk1/w1-system-font-manager` → `file:../w1-system-font-manager`
- `@werk1/w1-system-flipbook` → `file:../w1-system-flipbook`

---

## 4. Kopierte Dateien

### Skeleton-Basis

_(keine)_

### Modul-Dateien (aus core-v2)

- `flipbook-advantage/src/payload/collections/Flipbooks.ts`
- `flipbook-advantage/src/payload/components/FlipbookConvertButton.tsx`
- `flipbook-advantage/src/payload/components/FlipbookPublicLink.tsx`
- `flipbook-advantage/src/app/(payload)/api/flipbook-convert/route.ts`
- `flipbook-advantage/src/lib/flipbook/README.md`
- `flipbook-advantage/src/lib/flipbook/index.ts`
- `flipbook-advantage/src/lib/flipbook/pdfConverter.ts`
- `flipbook-advantage/src/lib/flipbook/payloadFlipbookConversion.ts`
- `flipbook-advantage/src/lib/flipbook/cleanup.ts`
- `flipbook-advantage/src/lib/flipbook/cover.ts`
- `flipbook-advantage/src/lib/flipbook/spreads.ts`
- `flipbook-advantage/src/payload/blocks/FlipbookSection.ts`
- `flipbook-advantage/src/lib/blocks/flipbook/config.ts`
- `flipbook-advantage/src/lib/blocks/flipbook/labels.ts`
- `flipbook-advantage/src/lib/blocks/flipbook/locale.ts`
- `flipbook-advantage/src/lib/blocks/flipbook/resolveFlipbookBlockInput.ts`
- `flipbook-advantage/src/lib/blocks/flipbook/types.ts`
- `flipbook-advantage/src/components/page/W1FlipbookSectionRenderer.tsx`
- `flipbook-advantage/src/components/flipbook/FlipbookReader.tsx`
- `flipbook-advantage/src/components/flipbook/FlipbookHeader.tsx`
- `flipbook-advantage/src/components/flipbook/FlipbookHeader.module.css`
- `flipbook-advantage/src/components/flipbook/FlipbookHome.tsx`
- `flipbook-advantage/src/app/(frontend)/flipbooks/[slug]/page.tsx`
- `flipbook-advantage/src/app/(frontend)/flipbooks/flipbooks.module.css`
- `flipbook-advantage/src/app/(frontend)/flipbooks/page.tsx`

---

## 5. Gerenderte Template-Dateien

- `tsconfig.json`
- `package.json`
- `next.config.mjs`
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `scripts/docker-dev-app.sh`
- `docker/dev/Dockerfile`
- `scripts/push.sh`
- `scripts/push.bat`
- `scripts/push.ps1`
- `scripts/workspace-push-node.mjs`
- `scripts/workspace-update.mjs`
- `scripts/upload-data.mjs`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `SYSTEM_DOCUMENTATION.md`
- `SYSTEM_MAP.md`
- `SYSTEM_CONTRACTS.md`
- `SYSTEM_TESTING.md`
- `docs/README.md`
- `docs/DOCUMENTATION_STRUCTURE.md`
- `docs/SYSTEM_OVERVIEW.md`
- `docs/SYNC_STATUS.md`
- `docs/contracts/generated-app-standalone-contract.md`
- `docs/contracts/app-host-package-boundary-contract.md`
- `docs/contracts/app-font-management-contract.md`
- `docs/contracts/app-package-boundary-contract.md`
- `docs/templates/bug.md`
- `docs/templates/ticket.md`
- `docs/templates/feature-plan.md`
- `docs/templates/implementation-report.md`
- `docs/templates/REVIEW_TEMPLATE.md`
- `docs/templates/REVIEW_TEMPLATE_STRICT.md`
- `docs/contracts/README.md`
- `docs/contracts/documentation-lifecycle-contract.md`
- `docs/templates/README.md`
- `docs/bugs/README.md`
- `docs/bugs/done/README.md`
- `docs/tickets/README.md`
- `docs/tickets/done/README.md`
- `docs/ideas/README.md`
- `docs/ideas/done/README.md`
- `docs/planning/README.md`
- `docs/planning/done/README.md`
- `docs/plans/README.md`
- `docs/plans/done/README.md`
- `docs/roadmaps/README.md`
- `docs/roadmaps/active/README.md`
- `docs/roadmaps/future/README.md`
- `docs/roadmaps/done/README.md`
- `docs/reports/README.md`
- `docs/reports/implementation/README.md`
- `docs/reports/technical-review/README.md`
- `docs/reports/review/README.md`
- `docs/archive/README.md`
- `docs/audit/README.md`
- `docs/contracts/flipbook-app-integration-contract.md`
- `autodeploy/multi/build_and_deploy_multi-repo.sh`
- `autodeploy/multi/multi_repo_build.sh`
- `autodeploy/multi/Dockerfile_Multi`
- `autodeploy/multi/Dockerfile_Multi_Autodeploy_Builder`
- `autodeploy/multi/Dockerfile_Migrator`
- `autodeploy/multi/reinstall-optional-deps.sh`
- `autodeploy/multi/validate-runtime-packages.js`
- `autodeploy/multi/setup_deploy_server.sh`
- `autodeploy/multi/test_setup_and_copy_multi-repo.sh`
- `.env.example`
- `.env.autodeploy`
- `src/types/payload-next-css.d.ts`
- `.gitignore`
- `.npmrc`
- `src/payload/blocks/index.ts`
- `src/payload/collections/index.ts`
- `src/payload/globals/index.ts`
- `src/payload/collections/Pages.ts`
- `src/payload/collections/Carousels.ts`
- `src/payload.config.ts`
- `src/payload/app-fonts/constants.ts`
- `src/app/(frontend)/[[...slug]]/page.tsx`
- `src/app/(frontend)/layout.tsx`
- `src/stores/boundStore.ts`
- `src/lib/pages/types.ts`
- `src/lib/pages/resolvePageSections.ts`
- `src/lib/payload/getPayloadClient.ts`
- `src/lib/pages/buildPageModel.ts`
- `src/components/page/PageSectionComponents.tsx`
- `src/components/page/SectionRenderer.tsx`
- `src/lib/blocks/carousel/types.ts`
- `src/lib/blocks/carousel/resolveCarouselBlockInput.ts`
- `src/components/page/W1CarouselSectionRenderer.tsx`

---

## 5.1 Rule Snapshot

| Feld | Wert |
|---|---|
| AppCreator Commit | `7da4141` |
| W1 Rule Snapshot | `unknown` |
| Basis Docs Source | `local generation snapshot` |
| Basis Docs Mode | `embedded-template-fallback` |
| Snapshot Datum | `2026-09-30 12:00:56 UTC` |
| Aktive Module | `flipbook` |
| Validator | `ok` |
| Snippet Warnungen | `0` |

### Modul-Snippets

| Modul | Paket | Snippet-Modus | Package-Integration | Version | Lokale Quelle |
|---|---|---|---|---|---|
| `flipbook` | `@werk1/w1-system-flipbook` | `cloned/file` | `file: sibling package` | `2026-09-29` | `docs/contracts/flipbook-app-integration-contract.md` |

### Package-Integration pro Modul

- `flipbook`: `file: sibling package`

### Snippet-Warnungen

_(keine)_

### Basis-Dokumente

- `AGENTS.md` aus lokalem Generation-Snapshot
- `SYSTEM_DOCUMENTATION.md` aus lokalem Generation-Snapshot
- `SYSTEM_MAP.md` aus lokalem Generation-Snapshot
- `SYSTEM_CONTRACTS.md` aus lokalem Generation-Snapshot
- `SYSTEM_TESTING.md` aus lokalem Generation-Snapshot

### Basis-Dokument-Warnungen

- ⚠️ W1_SYSTEM basis doc not found: AGENTS.md — using embedded template fallback.
- ⚠️ W1_SYSTEM basis doc not found: SYSTEM_DOCUMENTATION.md — using embedded template fallback.
- ⚠️ W1_SYSTEM basis doc not found: SYSTEM_MAP.md — using embedded template fallback.
- ⚠️ W1_SYSTEM basis doc not found: SYSTEM_CONTRACTS.md — using embedded template fallback.
- ⚠️ W1_SYSTEM basis doc not found: SYSTEM_TESTING.md — using embedded template fallback.

### Lokale Regel-/Docs-Dateien

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `SYSTEM_DOCUMENTATION.md`
- `SYSTEM_MAP.md`
- `SYSTEM_CONTRACTS.md`
- `SYSTEM_TESTING.md`
- `docs/README.md`
- `docs/DOCUMENTATION_STRUCTURE.md`
- `docs/SYSTEM_OVERVIEW.md`
- `docs/SYNC_STATUS.md`
- `docs/contracts/generated-app-standalone-contract.md`
- `docs/contracts/app-host-package-boundary-contract.md`
- `docs/contracts/app-font-management-contract.md`
- `docs/contracts/app-package-boundary-contract.md`
- `docs/templates/bug.md`
- `docs/templates/ticket.md`
- `docs/templates/feature-plan.md`
- `docs/templates/implementation-report.md`
- `docs/templates/REVIEW_TEMPLATE.md`
- `docs/templates/REVIEW_TEMPLATE_STRICT.md`
- `docs/contracts/README.md`
- `docs/contracts/documentation-lifecycle-contract.md`
- `docs/templates/README.md`
- `docs/bugs/README.md`
- `docs/bugs/done/README.md`
- `docs/tickets/README.md`
- `docs/tickets/done/README.md`
- `docs/ideas/README.md`
- `docs/ideas/done/README.md`
- `docs/planning/README.md`
- `docs/planning/done/README.md`
- `docs/plans/README.md`
- `docs/plans/done/README.md`
- `docs/roadmaps/README.md`
- `docs/roadmaps/active/README.md`
- `docs/roadmaps/future/README.md`
- `docs/roadmaps/done/README.md`
- `docs/reports/README.md`
- `docs/reports/implementation/README.md`
- `docs/reports/technical-review/README.md`
- `docs/reports/review/README.md`
- `docs/archive/README.md`
- `docs/audit/README.md`
- `docs/contracts/flipbook-app-integration-contract.md`

---

## 6. Post-Generation

- generated app docs validation: ok
- `npm install`
- `npm run generate:importmap`
- `npm run generate:types`
- `npx tsc --noEmit`
- `npm run build`

---

## 7. Manuelle Nacharbeiten

Diese Dateien wurden generiert, enthalten aber Platzhalter die manuell befüllt werden müssen:

### .env

```
MONGODB_URI=mongodb://mongo:27017/flipbook-advantage
PAYLOAD_SECRET=<zufälliger Secret-String>
NEXT_PUBLIC_SERVER_URL=http://localhost:3601
```

### .env.autodeploy

Pflichtfelder mit echten Werten befüllen:

| Variable | Beschreibung |
|---|---|
| `DOCKER_PASSWORD` | Docker Registry Passwort |
| `SSH_PRIVATE_KEY` | Pfad zum SSH-Key für GitHub |
| `SSH_BUILDER_PRIVATE_KEY` | Pfad zum SSH-Key für den Build-Server |
| `NPM_TOKEN` | npm Token für private @werk1-Pakete |
| `SSH_HOST` | IP/Hostname des Deploy-Servers |

> ⚠️ `.env.autodeploy` ist in `.gitignore` ausgeschlossen – nie committen!

### .npmrc

npm Token für private @werk1-Pakete eintragen:

```
//registry.npmjs.org/:_authToken=DEIN_NPM_TOKEN
```

> ⚠️ `.npmrc` ist in `.gitignore` ausgeschlossen – nie committen!

---

_Report automatisch erstellt durch `app-creator/create-project.mjs`_
