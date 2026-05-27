# V3 Data Contracts

This document records current frontend placeholder shapes and planned backend/API JSON contracts for VMPix-V3. It is documentation only. It does not alter schemas, backend code, frontend code, imports, routes, or V2 systems.

## Contract Principles

- VMPix-Data is the backend/API source of truth for live data.
- VMPix-V3 must tolerate missing, partial, delayed, or failed API data.
- Stable IDs are required before frontend routes, admin edits, or relationships can be trusted.
- `venue_id` is the source of truth for show/event location relationships. Venue names may be cached display labels, but they must not replace `venue_id`.
- Relationship fields should use arrays of stable IDs, not display names.
- `show_count` / `showCount` values are backend-owned rollups or validated derived fields, not hand-maintained frontend truth.
- `tagged_people` represents people explicitly tagged in a show, gallery, photo set, match, or media item.
- `winners` should be arrays where applicable because matches can have teams, multi-person winners, draws, no-contests, or unknown outcomes.
- Frontend modules must provide loading, empty, and error states at module boundaries.

## Naming And Compatibility

Current V3 frontend placeholders use camelCase fields such as `bandId`, `personId`, `showId`, `taggedShows`, and `taggedPhotos`.

Planned backend/API payloads should prefer stable snake_case fields such as `band_id`, `person_id`, `show_id`, `venue_id`, `tagged_people`, and `show_count`. Frontend adapters may map backend snake_case into existing camelCase module state while the static-first frontend is being migrated.

## Shared Response Envelope

Planned list responses should use a small, predictable envelope.

```json
{
  "data": [],
  "meta": {
    "count": 0,
    "source": "db",
    "generated_at": "2026-05-27T00:00:00Z"
  },
  "error": null
}
```

Planned detail responses should return a single object or `null` with an error state.

```json
{
  "data": null,
  "meta": {
    "source": "db"
  },
  "error": {
    "code": "not_found",
    "message": "Record not found."
  }
}
```

## Loading, Empty, And Error Expectations

Every frontend module should treat API data as optional.

- Loading: show a stable shell/module loading state without blocking global navigation.
- Empty: show a useful empty state when a list has no records or a relationship array is empty.
- Error: show a contained module error state and preserve shell navigation/back behavior.
- Missing fields: use safe display fallbacks such as `Unknown`, `TBD`, empty arrays, or hidden optional sections.
- Missing relationships: render the primary record and mark related content unavailable instead of crashing.
- Partial records: never assume arrays, dates, counts, media, venue references, or relationship IDs are present.

## Music Bands

Current frontend placeholder rows use `bandId`, `name`, `region`, `status`, `statusKey`, `albums`, and `thumb`.

Planned backend shape:

```json
{
  "band_id": "culling-the-herd",
  "slug": "culling-the-herd",
  "name": "Culling The Herd",
  "sort_name": "Culling The Herd",
  "status": "active",
  "region": "Charlotte, NC",
  "genres": ["metal"],
  "member_person_ids": ["adam-begin"],
  "related_band_ids": [],
  "show_ids": ["music-show-2008-06-28-culling-the-herd"],
  "venue_ids": ["the-underground-charlotte-nc"],
  "show_count": 42,
  "photo_count": 516,
  "thumbnail": {
    "label": "CTH",
    "media_id": null,
    "url": null
  },
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "music_bands:42",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Relationship expectations:

- `band_id` is stable and route-safe.
- `member_person_ids` links to Music People records.
- `show_ids` links to Music Shows records.
- `venue_ids` can be derived from shows and should not override show-level `venue_id`.
- `show_count` should equal the count of valid linked shows unless backend diagnostics explain a mismatch.

## Music Shows

Current frontend show placeholders appear inside music activity and person detail data. Person detail currently uses `showId`, date parts, title, venue name, location, tagged photo counts, and thumbnails.

Planned backend shape:

```json
{
  "show_id": "music-show-2008-06-28-culling-the-herd",
  "slug": "2008-06-28-culling-the-herd-the-underground",
  "title": "Culling The Herd / Early Archive Set",
  "event_date": "2008-06-28",
  "event_time": null,
  "venue_id": "the-underground-charlotte-nc",
  "venue_label": "The Underground",
  "location_label": "Charlotte, NC",
  "band_ids": ["culling-the-herd"],
  "performer_person_ids": ["adam-begin"],
  "tagged_people": [
    {
      "person_id": "adam-begin",
      "role": "vocals",
      "tag_count": 18,
      "source": "caption"
    }
  ],
  "set_ids": [],
  "gallery_ids": [],
  "photo_count": 64,
  "tagged_photo_count": 18,
  "notes": "Person-tagged placeholder subset pending final captions.",
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "music_shows:1001",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Relationship expectations:

- `venue_id` is required for trusted location relationships when known.
- `venue_label` and `location_label` are display helpers only.
- `band_ids`, `performer_person_ids`, and `tagged_people[].person_id` must reference stable records.
- `tagged_people` means the person is explicitly associated with media or show metadata, not merely a member of a related band.

## Music People

Current frontend placeholder rows use `personId`, `name`, `role`, `band`, `photos`, `sets`, and `thumb`. Current detail data uses `associatedBands` and `taggedShows`.

Planned backend shape:

```json
{
  "person_id": "adam-begin",
  "slug": "adam-begin",
  "display_name": "Adam Begin",
  "sort_name": "Begin, Adam",
  "roles": ["performer", "vocals"],
  "band_ids": ["culling-the-herd"],
  "show_ids": ["music-show-2008-06-28-culling-the-herd"],
  "tagged_show_ids": ["music-show-2008-06-28-culling-the-herd"],
  "venue_ids": ["the-underground-charlotte-nc"],
  "show_count": 42,
  "tagged_photo_count": 516,
  "first_seen_date": "2008-06-28",
  "latest_seen_date": "2018-04-22",
  "thumbnail": {
    "label": "AB",
    "media_id": null,
    "url": null
  },
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "music_people:12",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Relationship expectations:

- `person_id` is stable and route-safe.
- `band_ids` links people to bands without depending on display names.
- `tagged_show_ids` should match shows where the person appears in `tagged_people`.
- `show_count` should count real appearances/linked shows, not just tagged photos.

## Music Venues

Current frontend placeholders use venue display names and locations. Planned backend data must centralize venues by `venue_id`.

Planned backend shape:

```json
{
  "venue_id": "the-underground-charlotte-nc",
  "slug": "the-underground-charlotte-nc",
  "name": "The Underground",
  "city": "Charlotte",
  "state": "NC",
  "country": "US",
  "address": null,
  "latitude": null,
  "longitude": null,
  "aliases": ["Underground"],
  "music_show_ids": ["music-show-2008-06-28-culling-the-herd"],
  "wrestling_show_ids": [],
  "show_count": 1,
  "photo_count": 18,
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "venues:7",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Relationship expectations:

- `venue_id` is the source of truth for all music and wrestling show/event location joins.
- Venue display fields may be corrected later without changing show relationships.
- `show_count` should be derived from linked music and wrestling shows unless scoped fields are provided.

## Wrestling Shows And Matches

Current V3 frontend has a wrestling shell/module placeholder and admin prototype references. No active wrestling API contract is wired.

Planned wrestling show shape:

```json
{
  "wrestling_show_id": "wrestling-show-2026-01-18-example",
  "slug": "2026-01-18-example-event",
  "title": "Example Wrestling Event",
  "event_date": "2026-01-18",
  "promotion": "Example Promotion",
  "venue_id": "example-arena-city-st",
  "venue_label": "Example Arena",
  "location_label": "City, ST",
  "match_ids": ["wrestling-match-2026-01-18-001"],
  "person_ids": ["example-wrestler-a", "example-wrestler-b"],
  "tagged_people": [
    {
      "person_id": "example-wrestler-a",
      "role": "competitor",
      "tag_count": 12,
      "source": "match-card"
    }
  ],
  "photo_count": 120,
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "wrestling_shows:22",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Planned wrestling match shape:

```json
{
  "match_id": "wrestling-match-2026-01-18-001",
  "wrestling_show_id": "wrestling-show-2026-01-18-example",
  "match_order": 1,
  "match_type": "singles",
  "title": "Example Wrestler A vs Example Wrestler B",
  "participants": [
    {
      "person_id": "example-wrestler-a",
      "side": "A",
      "role": "competitor"
    },
    {
      "person_id": "example-wrestler-b",
      "side": "B",
      "role": "competitor"
    }
  ],
  "winners": ["example-wrestler-a"],
  "result": "pinfall",
  "championship_ids": [],
  "notes": null,
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "wrestling_matches:90",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Relationship expectations:

- `wrestling_show_id` links matches to their parent show.
- `venue_id` lives on the show/event record, not the match record.
- `participants[].person_id`, `person_ids`, `tagged_people[].person_id`, and `winners[]` must reference stable Wrestling People records.
- `winners` is always an array. Empty arrays are valid for unknown, draw, no-contest, or not-yet-entered results.

## Wrestling People

Current V3 frontend does not have a live wrestling people module. This is the planned backend shape.

```json
{
  "wrestling_person_id": "example-wrestler-a",
  "slug": "example-wrestler-a",
  "display_name": "Example Wrestler A",
  "sort_name": "Wrestler A, Example",
  "aliases": ["Example A"],
  "roles": ["wrestler"],
  "promotion_ids": [],
  "wrestling_show_ids": ["wrestling-show-2026-01-18-example"],
  "match_ids": ["wrestling-match-2026-01-18-001"],
  "venue_ids": ["example-arena-city-st"],
  "show_count": 1,
  "match_count": 1,
  "win_count": 1,
  "tagged_photo_count": 12,
  "first_seen_date": "2026-01-18",
  "latest_seen_date": "2026-01-18",
  "thumbnail": {
    "label": "EA",
    "media_id": null,
    "url": null
  },
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "wrestling_people:4",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Relationship expectations:

- `wrestling_person_id` is stable and route-safe.
- `match_ids` and `wrestling_show_ids` should be derived from match/show relationships where possible.
- `show_count` counts distinct shows, not matches. A person with multiple matches on one show should still count as one show for `show_count`.
- Winner statistics should derive from match `winners` arrays.

## Wrestling Venues

Wrestling and music should use the same venue source of truth where possible. A venue may have music shows, wrestling shows, or both.

Planned backend shape:

```json
{
  "venue_id": "example-arena-city-st",
  "slug": "example-arena-city-st",
  "name": "Example Arena",
  "city": "City",
  "state": "ST",
  "country": "US",
  "address": null,
  "latitude": null,
  "longitude": null,
  "aliases": [],
  "music_show_ids": [],
  "wrestling_show_ids": ["wrestling-show-2026-01-18-example"],
  "show_count": 1,
  "wrestling_show_count": 1,
  "music_show_count": 0,
  "photo_count": 120,
  "source": {
    "ingested_from": "sheets",
    "source_row_id": "venues:18",
    "last_imported_at": null
  },
  "updated_at": null
}
```

Relationship expectations:

- `venue_id` remains the canonical join key.
- `wrestling_show_ids` links to Wrestling Shows records.
- `show_count` should equal the combined valid linked show count unless scoped counts are used.

## Frontend Tolerance Checklist

Before switching a module from static placeholders to API data, verify that it handles:

- API unavailable.
- Empty `data` arrays.
- `data: null` detail responses.
- Missing `venue_id` with only display venue text available.
- Missing relationship arrays.
- Missing `show_count` or stale counts.
- Unknown people referenced by `tagged_people`.
- Matches with no winners, multiple winners, or unrecognized result strings.
- Records with stable IDs but incomplete display fields.
- Slow responses without breaking shell navigation or browser/back behavior.
