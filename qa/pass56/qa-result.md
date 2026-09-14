# PASS56 source verification — blocked before implementation

Application files changed: none. QA evidence only.

Inspected modules/wrestling.js poster normalization and renderer; css/modules.css reserved poster/image rules; only relevant image helper references in js/state.js and modules/music.js. No existing Person poster rendition selector or alternate poster field was found in these scoped paths.

Current behavior: normalizeWrestlingPersonDossierPrototypeEvent preserves raw row and poster. setWrestlingPersonDossierPrototypeEventPoster assigns event.poster directly. CSS keeps a reserved4:5 frame, max12.8rem height, image object-fit:cover. Existing readiness and guarded same-source behavior are intact.

Fresh live backend responses for Aaron Rourke, Ace Romero and Joseph Alexander expose poster only, with X4 URLs; no alternate thumbnail/medium poster field. See current-poster-fields.json.

Verified live originals:
- Aaron:2048x1152,831105 image-body bytes,383ms image-load observation in this run.
- Ace:2048x1152,819805 image-body bytes,261ms.
- Joseph: same first event/poster as Aaron; original served from browser cache on repeat.

SmugMug's documented display-size convention changes both directory and filename tokens. Applied X4 ->M for both unique posters; each returned HTTP404 and no image. Joseph's shared poster likewise fails. Removing the signature/using a legacy URL also failed for Aaron. These are diagnostic attempts, not shipped source candidates.

The current documented public ImageSizeDetails endpoints for both images returned HTTP401 Unauthorized without SmugMug API authorization. A usable Medium URL could not be verified from current public data. Do not ship a guessed source followed by original fallback: that adds a failed request before downloading the same large poster.

References:
- https://www.smugmughelp.com/hc/en-us/articles/18212296628884-Change-the-display-size-of-my-photos
- https://api.smugmug.com/api/v2/doc/reference/image.html

No smaller rendition was selected, so no before/after savings or visual-quality claim is available. Replacement viewport/layout/failure/navigation QA was not run because no source change exists. Existing source, routes, fitting, early lookup, loading states and Hall restoration remain untouched.

Required next input: an existing canonical smaller-poster URL field/helper, or verified rendition URLs supplied through the existing SmugMug/data integration. Adding backend fields or frontend authorization is outside this pass's explicit scope; no credentials, backend changes, new services or proxy were added.

PASS57 assessment: hidden Hall rerender is the next bounded frontend candidate, subject to protecting retained state/focus/scroll. Remaining SVG/projection/viewport setup needs evidence of worthwhile cost before changes. Avoid a broad startup rewrite for marginal savings. Poster optimization still depends on reliable rendition data.
