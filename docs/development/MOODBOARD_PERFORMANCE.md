# Moodboard performance and UX report

20 Nov 2026. Frontend and backend `release/staging-v1`, merged locally, not pushed.

## How it was measured

`e2e/moodboard.perf.spec.ts` (runs only with `PERF=1`) against the real backend and a production build: it uploads N 1600×1200 JPEGs (average 171 KB, the size the app stores) through `/brands/files/`, builds a one-zone board of N cards, then opens it cold, drags a card 60 steps, pans 60 wheel steps, waits for the save and reopens. Each figure below comes from that script, same images, same machine, before and after. `PERF_NET=4g` adds a Chrome network profile (60 ms latency, ~12 Mbps down), which is where loading costs show; localhost has none.

Lighthouse was not run: the board is authenticated and canvas-like, and the brief asked not to rely on it. LCP/INP-style questions are answered by the timings below.

## A. Audit: what was slow, and why

| Finding | Root cause | Where |
|---|---|---|
| Opening a board grew linearly with its images (4.2 s for 50 on 4G) and reopening was no faster | Every brand file was downloaded **one at a time** and turned into a base64 `data:` URL before the brand could render; nothing could be cached | `lib/data/adapters/serverFiles.ts` `inlineFiles`, `apiAdapter.ts` `fromServer` |
| 18 MB downloaded to show 8.5 MB of images | Each full page load re-downloaded every file of the brand (home, board, reopen) | same |
| 68 MB JS heap, 9 MB of strings | Images held as base64 in React state and in every sync comparison | same |
| 76.8 M pixels decoded to draw 0.97 M (79×) | Cards drew the 1600 px stored file at 240 px; no thumbnails existed | `components/board/card.tsx` |
| No upload progress, failures silent | Uploads were stored inline and sent by a later background sync; a refused file only logged to the console | `use-moodboard-actions.ts`, `serverFiles.ts` |
| No save feedback | The sync loop's state was not exposed | `apiAdapter.ts` |
| Blank screen while a brand loads | The brand layout rendered `null` until hydrated | `app/(studio)/w/[slug]/layout.tsx` |

Not bottlenecks (measured): dragging, resizing and panning already held 60 fps with no long tasks at 50 images. The canvas already culls off-screen cards, keeps the in-progress gesture out of board state, and saves once per drag (1 s debounce after pointer-up), never per pointer move. None of that was changed.

## B. What changed

| Change | Why | Files | Backend |
|---|---|---|---|
| Stored files stay URLs in the app | Removes the serial download gate, base64 memory and re-downloads | `apiAdapter.ts` | — |
| `crossOrigin` on pixel readers; `saveFile` for downloads | URLs on the media host must stay readable (colour sampling, export) and downloadable | `rasterize.ts`, `compliance/utils/color-extract.ts`, `lib/download.ts`, bulk bar, file blocks | Media already sends CORS |
| WebP thumbnails at 480 and 960 px for each raster upload; `make_thumbnails` backfill | Cards fetch and decode the size they draw | `apps/brands/thumbnails.py`, `services.py`, management command | **Yes** |
| Media served `Cache-Control: immutable` | Upload names are random and never reused | `apps/core/views.py` | **Yes** |
| `MoodImage` with `srcset` sized to the card, falls back to the original if a thumbnail is missing | | `components/board/mood-image.tsx`, `card.tsx`, `canvas.tsx` | — |
| Real uploads: validation (images, ≤25 MB after downscale), progress, per-file failure with Retry, duplicate guard, card added only after the server has the file | Brief §7, no fake success | `lib/api/uploadFile.ts`, `hooks/board/use-moodboard-uploads.ts`, `components/board/upload-tray.tsx` | — |
| Drop target while files hover the board | Brief §7 | `canvas.tsx` | — |
| Save indicator: Saving… / Saved (only after the server answers) / Couldn't save + Retry | Brief §6 | `lib/data/syncStatus.ts`, `contexts/useSyncStatus.ts`, `components/board/save-indicator.tsx` | — |
| Loading skeleton for brand pages | No blank screen; the empty state never shows while loading | `features/shell/components/brand-loading.tsx` | — |
| Empty state (five starting points) | **Untouched**, verified in Arabic | — | — |

## C. Before and after (measured)

50-image board, 4G profile:

| Metric | Before | After | Change |
|---|---|---|---|
| Board open (first card on screen) | 4,173 ms | 454 ms | −89% |
| All visible images loaded | 4,191 ms | 1,031 ms | −75% |
| Reopen | 4,090 ms | 397 ms | −90% |
| Image bytes downloaded (whole test) | 18.22 MB | 0.94 MB | −95% |
| Pixels decoded / drawn | 76.8 M / 0.97 M (79×) | 1.73 M / 0.97 M (1.8×) | −98% decoded |
| JS heap after open | 68 MB | 35 MB | −49% |
| Base64 image strings in memory | 9.2 MB | 0 | — |
| Drag: fps / p95 frame / frames > 50 ms | 60 / 17 ms / 0 | 60 / 17 ms / 0 | unchanged |
| Pan: fps / p95 frame | 60 / 17 ms | 60 / 17 ms | unchanged |
| Long tasks during open, drag, pan | 0 | 0 | unchanged |
| Saves during a drag / after it | 0 / 1 | 0 / 1 | unchanged |
| React commits during a 60-step drag | 62 | 62 | unchanged (one per pointer move, by design) |

Other sizes, 4G (open → images → reopen):

| Board | Before | After |
|---|---|---|
| 10 images | 1,507 / 1,518 / 1,454 ms, 4.13 MB | 451 / 549 / 400 ms, 0.68 MB |
| 25 images | 2,581 / 2,595 / 2,526 ms, 9.40 MB | 456 / 730 / 403 ms, 0.78 MB |

Localhost (no network shaping), open → images: 50 images 454 / 466 ms before, 122 / 152 ms after (10: 156→153 ms, 25: 269→106 ms). The localhost "after" figures come from the first after-run, on the same image pipeline but before the upload tray and save indicator were added; later localhost runs were blocked by the sign-in issue below.

Target check (set after the baseline): open < 1.5 s ✔ (0.45 s), reopen < 1 s ✔ (0.4 s), bytes < 3 MB ✔ (0.94), decode ratio < 6× ✔ (1.8×), heap < 35 MB ✔ (35), drag 60 fps ✔.

The ~950 React commits during a throttled open are Next.js streaming the page in (no component's props or state change, no long task); they were there before and are not from Markyos code.

## D. Testing

- `npm run check` (typecheck, lint, 763 unit tests, audits): pass.
- Backend: 820 tests (5 new for thumbnails, backfill, caching): pass.
- e2e, production build against an isolated backend: 28 passed (3 benchmark specs skipped by design), including a new upload test: drop two images, drop target shown, tray shown, two cards with server URLs, "Saved", server brand holds both.
- Arabic and RTL: empty state, drop target, upload tray and save indicator checked by screenshot; board coordinates are physical and unchanged.
- Not tested: real phone/tablet devices, very slow uploads (progress bars were too quick to see on localhost), the thumbnail backfill against staging's volume.

## E. Outstanding issues

1. **Sign-in race (not moodboard; needs a decision).** Every full page load rotates the refresh token, and the old one is blacklisted. If that request is cut short (navigating away mid-load, closing a tab), the browser never stores the new token and the person is signed out. It reproduces reliably in the benchmark now that pages load faster. Recommended fix: a short reuse window (e.g. 30 s) for a just-rotated refresh token on the server. Security-relevant, so not changed without approval.
2. **Thumbnail backfill**: run `python manage.py make_thumbnails` on staging after deploying, or older images keep loading the full file (they still display; the client falls back).
3. **Cloud storage**: thumbnails are written through `default_storage`, so they work with cloud storage too; the `immutable` cache header is set only where Django serves media (the CDN would need its own).
4. **Concurrent edits**: a save that loses a 409 race adopts the other copy ("theirs wins"); edits from the losing tab are dropped. Unchanged; needs a merge strategy to fix properly.
5. **Upload in the browser-only demo** still uses the previous inline path (no server to upload to).
6. **Mobile**: the board's existing phone behaviour was not changed or retested on devices.
