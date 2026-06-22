# VMPix V3 Home Story Prototype

Standalone extraction of the current VMPix V3 Home Screen story sequence for isolated animation iteration.

## Source Files Extracted From

- `C:\Users\deysx\Documents\GitHub\VMPix-V3\index.html`
- `C:\Users\deysx\Documents\GitHub\VMPix-V3\css\shell.css`

`js/home-story.js` is a standalone viewport-height helper created for this prototype so it can run outside the V3 shell without routing or Engine Bar code.

## Included Systems

- Blackness / initial darkness
- Void starfield
- Subtle starfield flicker and drift
- Transmission handshake
- `ARCHIVE NODE FOUND`
- `DECODING ARCHIVE...`
- `VOODOO MEDIA` to `V3` identity morph
- V3 circular access-control formation
- Mobile viewport height handling
- Reduced-motion support

## Excluded Systems

- V3 routing
- Engine Bar lifecycle and shell navigation
- Portfolio Hub
- Music module
- Wrestling module
- Calendar, About, Contact
- Backend/API calls
- Module data, gallery, route, or detail code
- Old Home title, welcome text, START button, geometry, heartbeat, archive borders, lightning, and portal systems

## Assets

The current isolated Home story sequence uses CSS-generated visual layers only. No image, video, font, or API assets are required for this standalone package.

The original V3 app references Google-hosted Audiowide in `index.html`; this prototype intentionally avoids external dependencies and falls back to local system display fonts unless Audiowide is already installed on the machine.

## How To Run Locally

Open `index.html` directly in a browser.

Optional local server:

```powershell
cd path\to\home-story-prototype
python -m http.server 8080
```

Then open `http://127.0.0.1:8080/`.

## How To Merge Approved Changes Back Into V3

1. Keep prototype work scoped to `index.html`, `css/home-story.css`, and `js/home-story.js`.
2. When an effect is approved, port only the relevant HTML/CSS/JS section back into:
   - `C:\Users\deysx\Documents\GitHub\VMPix-V3\index.html`
   - `C:\Users\deysx\Documents\GitHub\VMPix-V3\css\shell.css`
   - `C:\Users\deysx\Documents\GitHub\VMPix-V3\js\...` only if behavior code is actually added.
3. Preserve Home-only selectors such as `.site-shell.is-home-route` in V3 when merging.
4. Recheck Home, `/portfolio`, and one representative module route after every merge.
5. Keep routing, Engine Bar lifecycle, module routes, and backend/API behavior out of prototype merges unless explicitly requested.