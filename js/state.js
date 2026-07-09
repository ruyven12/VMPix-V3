/* =========================================================
   VMPix V3 state.
   Shared DOM references, mock data, and lightweight shell state.
   Extracted from the original single-file shell; keep this pass mechanical.
   Mock data inventory: docs/V3_MOCK_DATA_INVENTORY.md.
   ========================================================= */

const shell = document.querySelector(".site-shell");
const startButton = document.querySelector(".start-button");
const homeFrame = document.querySelector(".home-frame");
const portfolioHub = document.querySelector(".portfolio-hub");
const portfolioEntryTarget = document.querySelector("[data-portfolio-entry-target]");
const aboutShell = document.querySelector("[data-about-shell]");
const calendarShell = document.querySelector("[data-calendar-shell]");
const contactShell = document.querySelector("[data-contact-shell]");
const connectShell = document.querySelector("[data-connect-shell]");
const shellBreadcrumb = document.querySelector("[data-shell-breadcrumb]");
const shellBreadcrumbList = document.querySelector("[data-shell-breadcrumb-list]");
const bottomRail = document.querySelector("[data-shell-bottom-rail]");
const shellBackButton = document.querySelector("[data-shell-back]");
const railMenuTrigger = document.querySelector("[data-rail-menu-trigger]");
const globalMenuDrawer = document.querySelector("[data-global-menu-drawer]");
const globalMenuBackdrop = document.querySelector("[data-global-menu-backdrop]");
const globalMenuClose = document.querySelector("[data-global-menu-close]");
const globalMenuActions = document.querySelector("[data-global-menu-actions]");
let globalNavButtons = document.querySelectorAll("[data-global-nav-target]");
const hubCarousel = document.querySelector("[data-hub-carousel]");
const hubContext = document.querySelector("[data-hub-context]");
const currentView = document.querySelector("[data-current-view]");
const moduleCards = document.querySelectorAll("[data-module-card][data-module-state='active']");
const modulePlaceholder = document.querySelector("[data-module-placeholder]");
const modulePlaceholderKicker = document.querySelector("[data-module-placeholder-kicker]");
const modulePlaceholderTitle = document.querySelector("[data-module-placeholder-title]");
const modulePlaceholderCopy = document.querySelector("[data-module-placeholder-copy]");
const moduleBack = document.querySelector("[data-module-back]");
const musicNexusShell = document.querySelector("[data-music-nexus-shell]");
const musicNexusLanding = document.querySelector("[data-music-nexus-landing]");
const musicLandingRouteCards = document.querySelectorAll("[data-music-landing-route]");
const musicNexusCards = document.querySelectorAll("[data-music-nexus-card]");
const ringArchiveShell = document.querySelector("[data-ring-archive-shell]");
const ringArchiveBack = document.querySelector("[data-ring-archive-back]");
const ringArchiveShows = document.querySelector("[data-ring-archive-shows]");
const ringArchivePeople = document.querySelector("[data-ring-archive-people]");
const ringArchiveVenues = document.querySelector("[data-ring-archive-venues]");
const wrestlingPeopleShell = document.querySelector("[data-wrestling-people-shell]");
const wrestlingPeopleList = document.querySelector("[data-wrestling-people-list]");
const wrestlingPeopleBack = document.querySelector("[data-wrestling-people-back]");
const wrestlingPersonDetailShell = document.querySelector("[data-wrestling-person-detail-shell]");
const wrestlingVenuesShell = document.querySelector("[data-wrestling-venues-shell]");
const wrestlingVenuesList = document.querySelector("[data-wrestling-venues-list]");
const wrestlingVenuesBack = document.querySelector("[data-wrestling-venues-back]");
const wrestlingVenueDetailShell = document.querySelector("[data-wrestling-venue-detail-shell]");
const wrestlingShowsShell = document.querySelector("[data-wrestling-shows-shell]");
const wrestlingShowEntries = document.querySelectorAll("[data-wrestling-show-id]");
const wrestlingShowDetailShell = document.querySelector("[data-wrestling-show-detail-shell]");
const wrestlingShowDetailBack = document.querySelector("[data-wrestling-show-detail-back]");
const wrestlingMatchGalleryShell = document.querySelector("[data-wrestling-match-gallery-shell]");
const wrestlingMatchGalleryBack = document.querySelector("[data-wrestling-match-gallery-back]");
const wrestlingPhotoTiles = document.querySelectorAll("[data-wrestling-photo-id]");
const wrestlingLightboxShell = document.querySelector("[data-wrestling-lightbox-shell]");
const wrestlingLightboxPrev = document.querySelector("[data-wrestling-lightbox-prev]");
const wrestlingLightboxNext = document.querySelector("[data-wrestling-lightbox-next]");
const wrestlingLightboxCounter = document.querySelector("[data-wrestling-lightbox-counter]");
const wrestlingLightboxPhotoNumber = document.querySelector("[data-wrestling-lightbox-photo-number]");
const musicActivityPanel = document.querySelector("[data-music-activity-panel]");
const musicActivityList = document.querySelector("[data-music-activity-list]");
const musicBandsIndex = document.querySelector("[data-music-bands-index]");
const musicPeopleIndex = document.querySelector("[data-music-people-index]");
const musicPeopleList = document.querySelector("[data-music-people-list]");
const personDetail = document.querySelector("[data-person-detail]");
const showDetail = document.querySelector("[data-show-detail]");
const venueDetail = document.querySelector("[data-venue-detail]");
const musicVenuesIndex = document.querySelector("[data-music-venues-index]");
const musicVenuesFilters = document.querySelector("[data-music-venues-filters]");
const musicVenuesList = document.querySelector("[data-music-venues-list]");
const musicVenuesCount = document.querySelector("[data-music-venues-count]");
const venueDetailBack = document.querySelector("[data-venue-detail-back]");
const venueDetailLogoCard = document.querySelector("[data-venue-detail-logo-card]");
const venueDetailLogoMark = document.querySelector("[data-venue-detail-logo-mark]");
const venueDetailLogoLabel = document.querySelector("[data-venue-detail-logo-label]");
const venueDetailTitle = document.querySelector("[data-venue-detail-title]");
const venueDetailLocation = document.querySelector("[data-venue-detail-location]");
const venueDetailRegion = document.querySelector("[data-venue-detail-region]");
const venueDetailVisual = document.querySelector("[data-venue-detail-visual]");
const venueDetailVisualPrimary = document.querySelector("[data-venue-detail-visual-primary]");
const venueDetailVisualSecondary = document.querySelector("[data-venue-detail-visual-secondary]");
const venueDetailStatValues = Array.from(document.querySelectorAll("[data-venue-detail-stat]"));
const musicNexusBack = document.querySelector("[data-music-nexus-back]");
const bandsViewButtons = document.querySelectorAll("[data-bands-view-target]");
const bandsViewPanels = document.querySelectorAll("[data-bands-view]");
const bandsLetterNavs = document.querySelectorAll("[data-bands-letter-nav], [data-bands-letter-nav-list]");
const bandsStatus = document.querySelector("[data-bands-status]");
const bandsRadarLetter = document.querySelector("[data-bands-radar-letter]");
const bandsRadarCount = document.querySelector("[data-bands-radar-count]");
const bandsRadarSignals = document.querySelector("[data-bands-radar-signals]");
const bandsRadarPoints = document.querySelector("[data-bands-radar-points]");
const bandsList = document.querySelector("[data-bands-list]");
const bandsEmpty = document.querySelector("[data-bands-empty]");
const bandsListFilterBar = document.querySelector("[data-bands-list-filter-bar]");
const bandsFilterLetter = document.querySelector("[data-bands-filter-letter]");
const bandsFilterSummary = document.querySelector("[data-bands-filter-summary]");
const bandsBackRadar = document.querySelector("[data-bands-back-radar]");
const bandsSearchInput = document.querySelector("[data-bands-search-input]");
const bandsSearchResults = document.querySelector("[data-bands-search-results]");
const bandsSearchSummary = document.querySelector("[data-bands-search-summary]");
const bandsSearchChips = document.querySelectorAll("[data-bands-search-term]");
const bandsFilterSelects = document.querySelectorAll("[data-bands-filter]");
const bandsFilterResetButtons = document.querySelectorAll("[data-bands-filter-reset]");
const bandDetail = document.querySelector("[data-band-detail-placeholder]");
const bandDetailBack = document.querySelector("[data-band-detail-back]");
const bandDetailPoster = document.querySelector(".band-detail-poster");
const bandDetailLogoImage = document.querySelector("[data-band-detail-logo-image]");
const bandDetailThumb = document.querySelector("[data-band-detail-thumb]");
const bandDetailLogoName = document.querySelector("[data-band-detail-logo-name]");
const bandDetailName = document.querySelector("[data-band-detail-name]");
const bandDetailRegion = document.querySelector("[data-band-detail-region]");
const bandDetailTags = document.querySelector("[data-band-detail-tags]");
const bandDetailStatus = document.querySelector("[data-band-detail-status]");
const bandDetailLocation = document.querySelector("[data-band-detail-location]");
const bandDetailCompletionValue = document.querySelector("[data-band-detail-completion-value]");
const bandDetailProgressFill = document.querySelector("[data-band-detail-progress-fill]");
const bandDetailYearsCovered = document.querySelector("[data-band-detail-years-covered]");
const bandDetailMostActiveYear = document.querySelector("[data-band-detail-most-active-year]");
const bandDetailTotalPhotos = document.querySelector("[data-band-detail-total-photos]");
const bandDetailContributors = document.querySelector("[data-band-detail-contributors]");
const bandDetailSetsCaptured = document.querySelector("[data-band-detail-sets-captured]");
const bandDetailDataStatus = document.querySelector("[data-band-detail-data-status]");
const bandDetailLatestSeen = document.querySelector("[data-band-detail-latest-seen]");
const bandDetailLifecycleStatus = document.querySelector("[data-band-detail-lifecycle-status]");
const bandDetailLastUpdated = document.querySelector("[data-band-detail-last-updated]");
const bandDetailCoreMembers = document.querySelector("[data-band-detail-core-members]");
const bandDetailPastMembers = document.querySelector("[data-band-detail-past-members]");
const bandDetailViewSets = document.querySelector("[data-band-detail-view-sets]");
const setsArchive = document.querySelector("[data-sets-archive]");
const setsArchiveBack = document.querySelector("[data-sets-archive-back]");
const setsArchiveBand = document.querySelector("[data-sets-archive-band]");
const setsArchiveSummary = document.querySelector("[data-sets-archive-summary]");
const setsList = document.querySelector("[data-sets-list]");
const setsRows = document.querySelectorAll("[data-set-row]");
const setsFeaturedImage = document.querySelector("[data-sets-featured-image]");
const setsFeaturedPoster = document.querySelector("[data-sets-featured-poster]");
const setsFeaturedThumb = document.querySelector("[data-sets-featured-thumb]");
const setsFeaturedDate = document.querySelector("[data-sets-featured-date]");
const setsFeaturedTitle = document.querySelector("[data-sets-featured-title]");
const setsFeaturedLocation = document.querySelector("[data-sets-featured-location]");
const setsFeaturedPhotos = document.querySelector("[data-sets-featured-photos]");
const setsFeaturedContributors = document.querySelector("[data-sets-featured-contributors]");
const setsFeaturedComplete = document.querySelector("[data-sets-featured-complete]");
const setsFeaturedOpen = document.querySelector("[data-sets-open-set]");
const setDetailPlaceholder = document.querySelector("[data-set-detail-placeholder]");
const setDetailClose = document.querySelector("[data-set-detail-close]");
const setDetailBand = document.querySelector("[data-set-detail-band]");
const setDetailTitle = document.querySelector("[data-set-detail-title]");
const setDetailCopy = document.querySelector("[data-set-detail-copy]");
const setDetailDate = document.querySelector("[data-set-detail-date]");
const setDetailLocation = document.querySelector("[data-set-detail-location]");
const setDetailPhotos = document.querySelector("[data-set-detail-photos]");
const setDetailContributors = document.querySelector("[data-set-detail-contributors]");
const setDetailComplete = document.querySelector("[data-set-detail-complete]");
const setGallery = document.querySelector("[data-set-gallery]");
const setGalleryBack = document.querySelector("[data-set-gallery-back]");
const setGalleryBand = document.querySelector("[data-set-gallery-band]");
const setGalleryImage = document.querySelector("[data-set-gallery-image]");
const setGalleryPoster = document.querySelector("[data-set-gallery-poster]");
const setGalleryThumb = document.querySelector("[data-set-gallery-thumb]");
const setGalleryDate = document.querySelector("[data-set-gallery-date]");
const setGalleryTitle = document.querySelector("[data-set-gallery-title]");
const setGalleryShowId = document.querySelector("[data-set-gallery-show-id]");
const setGalleryCity = document.querySelector("[data-set-gallery-city]");
const setGalleryVenue = document.querySelector("[data-set-gallery-venue]");
const setGalleryPerformance = document.querySelector("[data-set-gallery-performance]");
const setGalleryPhotos = document.querySelector("[data-set-gallery-photos]");
const setGalleryContributors = document.querySelector("[data-set-gallery-contributors]");
const setGalleryQuality = document.querySelector("[data-set-gallery-quality]");
const setGalleryCamera = document.querySelector("[data-set-gallery-camera]");
const setGalleryNotes = document.querySelector("[data-set-gallery-notes]");
const galleryGrid = document.querySelector("[data-gallery-grid]");
const galleryPhotoTiles = document.querySelectorAll("[data-gallery-photo]");
const galleryViewOptions = document.querySelectorAll("[data-gallery-view-option]");
const galleryPhotoCount = document.querySelector("[data-gallery-count]");
const galleryPhotoWarning = document.querySelector("[data-gallery-warning]");
const galleryStatesShell = document.querySelector("[data-gallery-states]");
const galleryStates = document.querySelectorAll("[data-gallery-state]");
const galleryViewAll = document.querySelector("[data-gallery-view-all]");
const galleryLightboxPrep = document.querySelector("[data-gallery-lightbox-prep]");
const galleryLightboxTitle = document.querySelector("[data-gallery-lightbox-title]");
const lightboxScreen = document.querySelector("[data-lightbox-screen]");
const lightboxBack = document.querySelector("[data-lightbox-back]");
const lightboxPhoto = document.querySelector("[data-lightbox-photo]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxPhotoTitle = document.querySelector("[data-lightbox-photo-title]");
const lightboxCounter = document.querySelector("[data-lightbox-counter]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const lightboxInfoToggle = document.querySelector("[data-lightbox-info-toggle]");
const lightboxInfoPanel = document.querySelector("[data-lightbox-info-panel]");
const lightboxDrawerClose = document.querySelector("[data-lightbox-drawer-close]");
const lightboxMetaTitle = document.querySelector("[data-lightbox-meta-title]");
const lightboxMetaBandTags = document.querySelector("[data-lightbox-meta-band-tags]");
const lightboxMetaPeopleTags = document.querySelector("[data-lightbox-meta-people-tags]");
const lightboxMetaShow = document.querySelector("[data-lightbox-meta-show]");
const lightboxMetaVenue = document.querySelector("[data-lightbox-meta-venue]");
const lightboxMetaLocation = document.querySelector("[data-lightbox-meta-location]");
const lightboxMetaDate = document.querySelector("[data-lightbox-meta-date]");
const lightboxMetaPerformance = document.querySelector("[data-lightbox-meta-performance]");
const lightboxMetaCamera = document.querySelector("[data-lightbox-meta-camera]");
const lightboxMetaSource = document.querySelector("[data-lightbox-meta-source]");
const lightboxViewToggles = document.querySelectorAll("[data-lightbox-view-toggle]");
const lightboxThumbnailStrip = document.querySelector("[data-lightbox-thumbnail-strip]");
const lightboxThumbButtons = document.querySelectorAll("[data-lightbox-thumb]");
const lightboxFullscreenToggle = document.querySelector("[data-lightbox-fullscreen-toggle]");
const spotlightCopy = document.querySelector("[data-spotlight-copy]");
const spotlightTags = document.querySelector("[data-spotlight-tags]");
const fireVideo = document.querySelector(".cinema-fire-bg");
const reducedMotion = window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)")
  : { matches: false };
let spotlightFrame;
let drawerCloseTimer;
let activeBandsView = "radar";
let activeBandsLetter = "";
let activeBandsFilterLetter = "";
let activeBandsRegionFilter = "";
let activeBandsStatusFilter = "";
let bandsSearchTerm = "";
let bandsIndexReturnUrl = "/music/bands";
let activeMusicPeopleId = "";
let activeMusicPersonDetailId = "";
let activeWrestlingPersonId = "";
let activeWrestlingVenueId = "";
let activeMusicBand = null;
let activeSetRow = null;
let isSetDetailOpen = false;
let activeGalleryPhoto = null;
let activeGalleryViewMode = "grid";
let isGalleryModeOpen = false;
let activeSetGalleryPhotoMode = "preview";
let activeSetGalleryPhotoTotal = 0;
let activeLightboxIndex = 0;
let isLightboxThumbnailStripOpen = false;
let areLightboxControlsHidden = false;
let lightboxTransitionSourceTimer;
let lightboxEntryTimer;
let lightboxImageTransitionTimer;
let lightboxSwipeCommitTimer;
let lightboxSwipeGesture = null;
let lightboxGestureSuppressClick = false;
let lightboxFallbackAttempted = false;
let activeMusicShowsSearch = "";
let activeMusicShowsYearFilter = "";
let activeMusicShowsStateFilter = "";
let activeMusicShowsVenueFilter = "";

const setImageAccents = [
  { x: "42%", y: "38%", color: "rgba(142, 108, 255, 0.24)" },
  { x: "58%", y: "36%", color: "rgba(78, 184, 255, 0.2)" },
  { x: "48%", y: "54%", color: "rgba(255, 186, 108, 0.18)" },
  { x: "62%", y: "48%", color: "rgba(119, 255, 207, 0.16)" },
];

const lightboxPhotoRatios = [
  "16 / 10",
  "4 / 5",
  "21 / 9",
  "3 / 4",
  "16 / 9",
  "1 / 1",
  "5 / 4",
  "9 / 16",
];

const galleryImageFallbackSrc = "/assets/media/placeholders/archive-gallery-placeholder.svg";
const lightboxTransitionDuration = 220;
const lightboxImageTransitionDuration = 180;
const lightboxGestureThreshold = 46;
const lightboxGestureVerticalLimit = 82;
const lightboxGestureMaxDuration = 620;

const spotlightContent = {
  music: {
    copy: "Sound archive lanes are staged for bands, shows, people, and venues.",
    tags: ["Bands", "Shows", "People", "Venues"],
  },
  wrestling: {
    copy: "Ring archive lanes are staged for shows, matches, people, and venues.",
    tags: ["Shows", "Matches", "People", "Venues"],
  },
  future: {
    copy: "Future world lane reserved for archive expansion.",
    tags: ["Queued", "Future World"],
  },
};

const modulePlaceholderContent = {};

const musicActivityContent = {
  bands: [
    "Latest bands placeholder",
    "Featured artists placeholder",
    "Band archive updates placeholder",
    "New music gallery placeholder",
  ],
  shows: [
    "Recent concerts placeholder",
    "Show year index placeholder",
    "Concert gallery queue placeholder",
    "Setlist note placeholder",
  ],
  people: [
  ],
  venues: [
    "Venue archive placeholder",
    "Location index placeholder",
    "Room history placeholder",
    "Venue gallery queue placeholder",
  ],
};

const musicShowsArchiveRows = [
  {
    showId: "spring-voltage-2026",
    month: "MAY",
    day: "16",
    year: "2026",
    title: "Spring Voltage",
    venue: "The Electric Hall",
    location: "Philadelphia, PA",
    bandCount: "8 bands",
    poster: "SV",
  },
  {
    showId: "basement-frequency-2026",
    month: "MAR",
    day: "28",
    year: "2026",
    title: "Basement Frequency",
    venue: "Black Box Room",
    location: "Baltimore, MD",
    bandCount: "5 bands",
    poster: "BF",
  },
  {
    showId: "autumn-static-2025",
    month: "NOV",
    day: "09",
    year: "2025",
    title: "Autumn Static",
    venue: "Warehouse 44",
    location: "Richmond, VA",
    bandCount: "7 bands",
    poster: "AS",
  },
  {
    showId: "late-summer-noise-2025",
    month: "AUG",
    day: "22",
    year: "2025",
    title: "Late Summer Noise",
    venue: "The Lantern",
    location: "Lancaster, PA",
    bandCount: "6 bands",
    poster: "LS",
  },
  {
    showId: "winter-signal-2024",
    month: "DEC",
    day: "14",
    year: "2024",
    title: "Winter Signal",
    venue: "North Street Stage",
    location: "Harrisburg, PA",
    bandCount: "4 bands",
    poster: "WS",
  },
  {
    showId: "labor-day-feedback-2023",
    month: "SEP",
    day: "02",
    year: "2023",
    title: "Labor Day Feedback",
    venue: "The Mill",
    location: "Allentown, PA",
    bandCount: "9 bands",
    poster: "LD",
  },
];

const musicBandIndexRows = [
  { bandId: "13-high", name: "Astra Vale", region: "Local", status: "Complete", statusKey: "complete", albums: 12, thumb: "AV" },
  { bandId: "3fd", name: "Black Harbor", region: "Regional", status: "Partial", statusKey: "partial", albums: 8, thumb: "BH" },
  { bandId: "4x4-barracuda", name: "Crimson Static", region: "National", status: "Complete", statusKey: "complete", albums: 34, thumb: "CS" },
  { bandId: "6-gig", name: "Dead Letters", region: "Local", status: "Partial", statusKey: "partial", albums: 4, thumb: "DL" },
  { bandId: "a-river-of-trees", name: "Echo District", region: "International", status: "Complete", statusKey: "complete", albums: 18, thumb: "ED" },
  { bandId: "glass-ritual", name: "Glass Ritual", region: "Regional", status: "Needs Work", statusKey: "needs", albums: 6, thumb: "GR" },
  { bandId: "hollow-signal", name: "Hollow Signal", region: "Local", status: "Complete", statusKey: "complete", albums: 9, thumb: "HS" },
  { bandId: "moon-circuit", name: "Moon Circuit", region: "National", status: "Partial", statusKey: "partial", albums: 11, thumb: "MC" },
  { bandId: "neon-saints", name: "Neon Saints", region: "International", status: "Complete", statusKey: "complete", albums: 27, thumb: "NS" },
  { bandId: "ritual-bloom", name: "Ritual Bloom", region: "Regional", status: "Needs Work", statusKey: "needs", albums: 5, thumb: "RB" },
  { bandId: "silver-static", name: "Silver Static", region: "National", status: "Partial", statusKey: "partial", albums: 16, thumb: "SS" },
  { bandId: "violet-machines", name: "Violet Machines", region: "International", status: "Complete", statusKey: "complete", albums: 22, thumb: "VM" },
].sort((a, b) => a.name.localeCompare(b.name));

const musicPeopleRows = [
  { personId: "adam-begin", name: "Adam Begin", role: "Performer / Vocals", band: "Culling The Herd", photos: 516, sets: 42, thumb: "AB" },
  { personId: "mara-quinn", name: "Mara Quinn", role: "Guitar", band: "Black Harbor", photos: 142, sets: 8, thumb: "MQ" },
  { personId: "jonas-vale", name: "Jonas Vale", role: "Drums", band: "Crimson Static", photos: 318, sets: 34, thumb: "JV" },
  { personId: "selene-cross", name: "Selene Cross", role: "Bass", band: "Dead Letters", photos: 74, sets: 4, thumb: "SC" },
  { personId: "theo-mercer", name: "Theo Mercer", role: "Keys", band: "Echo District", photos: 221, sets: 18, thumb: "TM" },
  { personId: "rhea-blake", name: "Rhea Blake", role: "Vocalist", band: "Glass Ritual", photos: 96, sets: 6, thumb: "RB" },
  { personId: "cass-wilder", name: "Cass Wilder", role: "Guitar", band: "Hollow Signal", photos: 136, sets: 9, thumb: "CW" },
  { personId: "nico-ash", name: "Nico Ash", role: "Drums", band: "Moon Circuit", photos: 168, sets: 11, thumb: "NA" },
  { personId: "iris-fane", name: "Iris Fane", role: "Bass", band: "Neon Saints", photos: 284, sets: 27, thumb: "IF" },
  { personId: "luca-voss", name: "Luca Voss", role: "Synth", band: "Violet Machines", photos: 256, sets: 22, thumb: "LV" },
];

const musicPersonDetailPlaceholder = {
  personId: "adam-begin",
  imageLabel: "AB",
  name: "ADAM BEGIN",
  roleItems: ["Performer", "Vocals"],
  summaryItems: ["128 Appearances", "42 Shows", "516 Tagged Photos"],
  seenItems: ["First Seen 06.28.2008", "Latest Seen 04.22.2018"],
  associatedBands: ["Culling The Herd"],
  taggedShows: [
    {
      showId: "adam-begin-062808",
      date: { month: "JUN", day: "28", year: "2008" },
      thumb: "06.28",
      title: "Culling The Herd / Early Archive Set",
      venue: "The Underground",
      location: "Charlotte, NC",
      taggedPhotos: 18,
      expanded: true,
      contributors: "Contributors: Voodoo Media / Archive Hold",
      notes: "Placeholder notes for photos tagged or captioned with Adam Begin only.",
      thumbnails: ["AB 01", "AB 02", "AB 03", "AB 04"],
    },
    {
      showId: "adam-begin-091210",
      date: { month: "SEP", day: "12", year: "2010" },
      thumb: "09.12",
      title: "Culling The Herd / Fall Room Archive",
      venue: "Tremont Music Hall",
      location: "Charlotte, NC",
      taggedPhotos: 24,
      expanded: false,
      contributors: "Contributors: Voodoo Media",
      notes: "Person-tagged placeholder subset pending final captions.",
      thumbnails: ["AB 05", "AB 06", "AB 07"],
    },
    {
      showId: "adam-begin-042218",
      date: { month: "APR", day: "22", year: "2018" },
      thumb: "04.22",
      title: "Culling The Herd / Latest Tagged Appearance",
      venue: "The Milestone",
      location: "Charlotte, NC",
      taggedPhotos: 31,
      expanded: false,
      contributors: "Contributors: Voodoo Media / Guest Archive",
      notes: "Static placeholder for future tagged-show detail expansion.",
      thumbnails: ["AB 08", "AB 09", "AB 10"],
    },
  ],
};

const musicPersonDetailStateCopy = {
  loading: {
    title: "Loading Person Archive",
    copy: "Archive person records are being prepared.",
  },
  empty: {
    title: "Archive Record Unavailable",
    copy: "No matching archive record was found.",
  },
  error: {
    title: "Unable To Load Archive Data",
    copy: "Person archive data could not be loaded.",
  },
};

const wrestlingPeopleRows = [
  {
    personId: "ace-romero",
    name: "Ace Romero",
    aliases: ["Acey Baby", "The Big Boofa"],
    role: "Wrestler",
    factionTeam: "The Mane Event",
    teamIds: ["the-mane-event"],
    factionIds: ["the-mane-event"],
    showIds: ["gnomie-and-the-machine", "limitless-rumble-26", "massacre-in-maine", "never-enough"],
    matchIds: ["ace-romero-vs-anthony-gangone", "limitless-rumble-entry-sequence", "ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise", "ace-romero-vs-alexander-james"],
    venueIds: ["auburn-hall", "cross-insurance-center", "portland-expo"],
    taggedPeople: [{ personId: "ace-romero", role: "wrestler", tagCount: 618 }],
    refereeIds: [],
    managerIds: [],
    commentatorIds: [],
    contributorIds: ["voodoo-media"],
    debutYear: "2010",
    matches: 42,
    photos: 618,
    thumb: "AR",
  },
  {
    personId: "adam-christopher",
    name: "Adam Christopher",
    aliases: ["A. Christopher"],
    role: "Referee",
    factionTeam: "Official Crew",
    teamIds: ["official-crew"],
    factionIds: [],
    showIds: ["warzone-26", "gnomie-and-the-machine", "limitless-rumble-26", "massacre-in-maine"],
    matchIds: ["daron-richardson-vs-bear-bronson", "ace-romero-vs-anthony-gangone", "limitless-rumble-entry-sequence"],
    venueIds: ["portland-expo", "auburn-hall", "cross-insurance-center"],
    taggedPeople: [{ personId: "adam-christopher", role: "referee", tagCount: 184 }],
    refereeIds: ["adam-christopher"],
    managerIds: [],
    commentatorIds: [],
    contributorIds: ["voodoo-media"],
    debutYear: "2018",
    matches: 96,
    photos: 184,
    thumb: "AC",
  },
  {
    personId: "aj-cruise",
    name: "AJ Cruise",
    aliases: ["A.J. Cruise"],
    role: "Wrestler",
    factionTeam: "Cruise Control",
    teamIds: ["cruise-control"],
    factionIds: ["cruise-control"],
    showIds: ["massacre-in-maine"],
    matchIds: ["ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise"],
    venueIds: ["portland-expo"],
    taggedPeople: [{ personId: "aj-cruise", role: "wrestler", tagCount: 312 }],
    refereeIds: [],
    managerIds: [],
    commentatorIds: [],
    contributorIds: ["voodoo-media"],
    debutYear: "2016",
    matches: 28,
    photos: 312,
    thumb: "AJ",
  },
  {
    personId: "alexander-james",
    name: "Alexander James",
    aliases: ["The Crown Jewel"],
    role: "Wrestler",
    factionTeam: "The Embassy",
    teamIds: ["the-embassy"],
    factionIds: ["the-embassy"],
    showIds: ["massacre-in-maine", "never-enough"],
    matchIds: ["ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise", "ace-romero-vs-alexander-james"],
    venueIds: ["portland-expo"],
    taggedPeople: [{ personId: "alexander-james", role: "wrestler", tagCount: 407 }],
    refereeIds: [],
    managerIds: [],
    commentatorIds: [],
    contributorIds: ["voodoo-media"],
    debutYear: "2012",
    matches: 35,
    photos: 407,
    thumb: "AJ",
  },
  {
    personId: "andrew-palace",
    name: "Andrew Palace",
    aliases: ["The King Of The North"],
    role: "Wrestler",
    factionTeam: "Palace Guard",
    teamIds: ["palace-guard"],
    factionIds: ["palace-guard"],
    showIds: ["massacre-in-maine"],
    matchIds: ["ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise"],
    venueIds: ["portland-expo"],
    taggedPeople: [{ personId: "andrew-palace", role: "wrestler", tagCount: 366 }],
    refereeIds: [],
    managerIds: [],
    commentatorIds: [],
    contributorIds: ["voodoo-media"],
    debutYear: "2014",
    matches: 31,
    photos: 366,
    thumb: "AP",
  },
  {
    personId: "anthony-gangone",
    name: "Anthony Gangone",
    aliases: ["The Rogue"],
    role: "Wrestler",
    factionTeam: "The Gangone Collective",
    teamIds: ["the-gangone-collective"],
    factionIds: ["the-gangone-collective"],
    showIds: ["gnomie-and-the-machine"],
    matchIds: ["ace-romero-vs-anthony-gangone"],
    venueIds: ["auburn-hall"],
    taggedPeople: [{ personId: "anthony-gangone", role: "wrestler", tagCount: 452 }],
    refereeIds: [],
    managerIds: [],
    commentatorIds: [],
    contributorIds: ["voodoo-media"],
    debutYear: "2013",
    matches: 39,
    photos: 452,
    thumb: "AG",
  },
];

const wrestlingPersonEventHistoryRows = [
  {
    showId: "gnomie-and-the-machine",
    eventId: "gnomie-and-the-machine",
    matchId: "ace-romero-vs-anthony-gangone",
    venueId: "auburn-hall",
    personIds: ["ace-romero", "anthony-gangone"],
    taggedPeople: [
      { personId: "ace-romero", role: "competitor", tagCount: 24 },
      { personId: "anthony-gangone", role: "competitor", tagCount: 24 },
    ],
    refereeIds: ["adam-christopher"],
    managerIds: [],
    commentatorIds: ["limitless-commentary-desk"],
    contributorIds: ["voodoo-media"],
    teamIds: ["the-mane-event", "the-gangone-collective"],
    factionIds: ["the-mane-event", "the-gangone-collective"],
    eventName: "Gnomie and the Machine",
    eventDate: "February 21st, 2026",
    matchName: "Ace Romero vs Anthony Gangone",
    matchType: "Singles Match",
    photoCount: 48,
  },
  {
    showId: "limitless-rumble-26",
    eventId: "limitless-rumble-26",
    matchId: "limitless-rumble-entry-sequence",
    venueId: "cross-insurance-center",
    personIds: ["ace-romero"],
    taggedPeople: [{ personId: "ace-romero", role: "rumble-entry", tagCount: 64 }],
    refereeIds: ["adam-christopher"],
    managerIds: [],
    commentatorIds: ["limitless-commentary-desk"],
    contributorIds: ["voodoo-media"],
    teamIds: ["the-mane-event"],
    factionIds: ["the-mane-event"],
    eventName: "Limitless Rumble '26",
    eventDate: "January 16th, 2026",
    matchName: "Limitless Rumble Entry Sequence",
    matchType: "Rumble Match",
    photoCount: 64,
  },
  {
    showId: "massacre-in-maine",
    eventId: "massacre-in-maine",
    matchId: "ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise",
    venueId: "portland-expo",
    personIds: ["ace-romero", "andrew-palace", "alexander-james", "aj-cruise"],
    taggedPeople: [
      { personId: "ace-romero", role: "competitor", tagCount: 9 },
      { personId: "andrew-palace", role: "competitor", tagCount: 9 },
      { personId: "alexander-james", role: "competitor", tagCount: 9 },
      { personId: "aj-cruise", role: "competitor", tagCount: 9 },
    ],
    refereeIds: ["adam-christopher"],
    managerIds: [],
    commentatorIds: ["limitless-commentary-desk"],
    contributorIds: ["voodoo-media"],
    teamIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"],
    factionIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"],
    eventName: "Massacre In Maine",
    eventDate: "November 8th, 2025",
    matchName: "Ace Romero and Andrew Palace vs Alexander James and AJ Cruise",
    matchType: "Tag Team Match",
    photoCount: 36,
  },
  {
    showId: "never-enough",
    eventId: "never-enough",
    matchId: "ace-romero-vs-alexander-james",
    venueId: "portland-expo",
    personIds: ["ace-romero", "alexander-james"],
    taggedPeople: [
      { personId: "ace-romero", role: "competitor", tagCount: 21 },
      { personId: "alexander-james", role: "competitor", tagCount: 21 },
    ],
    refereeIds: ["adam-christopher"],
    managerIds: [],
    commentatorIds: ["limitless-commentary-desk"],
    contributorIds: ["voodoo-media"],
    teamIds: ["the-mane-event", "the-embassy"],
    factionIds: ["the-mane-event", "the-embassy"],
    eventName: "Never Enough",
    eventDate: "September 20th, 2025",
    matchName: "Ace Romero vs Alexander James",
    matchType: "Featured Match",
    photoCount: 42,
  },
];

const wrestlingVenueRows = [
  { venueId: "portland-expo", name: "Portland Expo", city: "Portland", state: "ME", region: "Southern Maine", archiveState: "Static venue placeholder", showIds: ["warzone-26", "massacre-in-maine", "never-enough"], matchIds: ["daron-richardson-vs-bear-bronson", "ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise", "ace-romero-vs-alexander-james"], contributorIds: ["voodoo-media"], eventCount: 24, photoCount: 1840, imageLabel: "PX" },
  { venueId: "westbrook-armory", name: "Westbrook Armory", city: "Westbrook", state: "ME", region: "Southern Maine", archiveState: "Static venue placeholder", showIds: ["warzone-26"], matchIds: ["daron-richardson-vs-bear-bronson"], contributorIds: ["voodoo-media"], eventCount: 18, photoCount: 1296, imageLabel: "WA" },
  { venueId: "portland-club", name: "Portland Club", city: "Portland", state: "ME", region: "Southern Maine", archiveState: "Static venue placeholder", showIds: ["cant-kick-up-the-roots"], matchIds: [], contributorIds: ["voodoo-media"], eventCount: 12, photoCount: 864, imageLabel: "PC" },
  { venueId: "auburn-hall", name: "Auburn Hall", city: "Auburn", state: "ME", region: "Central Maine", archiveState: "Static venue placeholder", showIds: ["gnomie-and-the-machine"], matchIds: ["ace-romero-vs-anthony-gangone"], contributorIds: ["voodoo-media"], eventCount: 9, photoCount: 612, imageLabel: "AH" },
  { venueId: "cross-insurance-center", name: "Cross Insurance Center", city: "Bangor", state: "ME", region: "Northern Maine", archiveState: "Static venue placeholder", showIds: ["limitless-rumble-26"], matchIds: ["limitless-rumble-entry-sequence"], contributorIds: ["voodoo-media"], eventCount: 7, photoCount: 540, imageLabel: "CI" },
  { venueId: "bissell-brothers-brewing-co", name: "Bissell Brothers Brewing Co.", city: "Portland", state: "ME", region: "Southern Maine", archiveState: "Static venue placeholder", showIds: ["bissell-brothers-bash-26"], matchIds: [], contributorIds: ["voodoo-media"], eventCount: 5, photoCount: 386, imageLabel: "BB" },
];

const wrestlingVenueEventHistoryRows = [
  { showId: "warzone-26", venueId: "portland-expo", matchIds: ["daron-richardson-vs-bear-bronson"], personIds: ["daron-richardson", "bear-bronson"], taggedPeople: [{ personId: "daron-richardson", role: "competitor", tagCount: 64 }, { personId: "bear-bronson", role: "competitor", tagCount: 64 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: [], factionIds: [], eventName: "Warzone '26", promotion: "Limitless Wrestling", eventDate: "May 8th, 2026", photoCount: 128 },
  { showId: "limitless-rumble-26", venueId: "portland-expo", matchIds: ["limitless-rumble-entry-sequence"], personIds: ["ace-romero"], taggedPeople: [{ personId: "ace-romero", role: "rumble-entry", tagCount: 96 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event"], factionIds: ["the-mane-event"], eventName: "Limitless Rumble '26", promotion: "Limitless Wrestling", eventDate: "January 16th, 2026", photoCount: 96 },
  { showId: "massacre-in-maine", venueId: "portland-expo", matchIds: ["ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise"], personIds: ["ace-romero", "andrew-palace", "alexander-james", "aj-cruise"], taggedPeople: [{ personId: "ace-romero", role: "competitor", tagCount: 18 }, { personId: "andrew-palace", role: "competitor", tagCount: 18 }, { personId: "alexander-james", role: "competitor", tagCount: 19 }, { personId: "aj-cruise", role: "competitor", tagCount: 19 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"], factionIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"], eventName: "Massacre In Maine", promotion: "Limitless Wrestling", eventDate: "November 8th, 2025", photoCount: 74 },
];

const wrestlingShowRelationshipRows = [
  { showId: "warzone-26", venueId: "portland-expo", galleryMatchId: "daron-richardson-vs-bear-bronson", matchIds: ["daron-richardson-vs-bear-bronson", "maggie-lee-vs-jada-stone", "b3-vs-jada-stone-brooke-havok-and-odb", "scotty-2-hotty-vs-keagan-garland", "post-match-attack-scotty-keagan-23-hazard", "the-limit-vs-team-limitless"], personIds: ["daron-richardson", "bear-bronson", "maggie-lee", "jada-stone", "brooke-havok", "odb", "scotty-2-hotty", "keagan-garland"], taggedPeople: [{ personId: "daron-richardson", role: "competitor", tagCount: 24 }, { personId: "bear-bronson", role: "competitor", tagCount: 24 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["b3", "team-limitless", "the-limit"], factionIds: ["23-hazard"], photoIds: ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012"] },
  { showId: "cant-kick-up-the-roots", venueId: "portland-club", galleryMatchId: "", matchIds: [], personIds: [], taggedPeople: [], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: [], factionIds: [], photoIds: [] },
  { showId: "bissell-brothers-bash-26", venueId: "bissell-brothers-brewing-co", galleryMatchId: "", matchIds: [], personIds: [], taggedPeople: [], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: [], factionIds: [], photoIds: [] },
  { showId: "gnomie-and-the-machine", venueId: "auburn-hall", galleryMatchId: "ace-romero-vs-anthony-gangone", matchIds: ["ace-romero-vs-anthony-gangone"], personIds: ["ace-romero", "anthony-gangone"], taggedPeople: [{ personId: "ace-romero", role: "competitor", tagCount: 24 }, { personId: "anthony-gangone", role: "competitor", tagCount: 24 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event", "the-gangone-collective"], factionIds: ["the-mane-event", "the-gangone-collective"], photoIds: [] },
  { showId: "limitless-rumble-26", venueId: "cross-insurance-center", galleryMatchId: "limitless-rumble-entry-sequence", matchIds: ["limitless-rumble-entry-sequence"], personIds: ["ace-romero"], taggedPeople: [{ personId: "ace-romero", role: "rumble-entry", tagCount: 96 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event"], factionIds: ["the-mane-event"], photoIds: [] },
  { showId: "massacre-in-maine", venueId: "portland-expo", galleryMatchId: "ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise", matchIds: ["ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise"], personIds: ["ace-romero", "andrew-palace", "alexander-james", "aj-cruise"], taggedPeople: [{ personId: "ace-romero", role: "competitor", tagCount: 18 }, { personId: "andrew-palace", role: "competitor", tagCount: 18 }, { personId: "alexander-james", role: "competitor", tagCount: 19 }, { personId: "aj-cruise", role: "competitor", tagCount: 19 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"], factionIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"], photoIds: [] },
  { showId: "never-enough", venueId: "portland-expo", galleryMatchId: "ace-romero-vs-alexander-james", matchIds: ["ace-romero-vs-alexander-james"], personIds: ["ace-romero", "alexander-james"], taggedPeople: [{ personId: "ace-romero", role: "competitor", tagCount: 21 }, { personId: "alexander-james", role: "competitor", tagCount: 21 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event", "the-embassy"], factionIds: ["the-mane-event", "the-embassy"], photoIds: [] },
];

const wrestlingMatchRelationshipRows = [
  { showId: "warzone-26", matchId: "daron-richardson-vs-bear-bronson", venueId: "portland-expo", personIds: ["daron-richardson", "bear-bronson"], taggedPeople: [{ personId: "daron-richardson", role: "competitor", tagCount: 24 }, { personId: "bear-bronson", role: "competitor", tagCount: 24 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: [], factionIds: [], photoIds: ["001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012"] },
  { showId: "warzone-26", matchId: "maggie-lee-vs-jada-stone", venueId: "portland-expo", personIds: ["maggie-lee", "jada-stone"], taggedPeople: [{ personId: "maggie-lee", role: "competitor", tagCount: 0 }, { personId: "jada-stone", role: "competitor", tagCount: 0 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: [], factionIds: [], photoIds: [] },
  { showId: "warzone-26", matchId: "b3-vs-jada-stone-brooke-havok-and-odb", venueId: "portland-expo", personIds: ["b3", "jada-stone", "brooke-havok", "odb"], taggedPeople: [{ personId: "b3", role: "competitor", tagCount: 0 }, { personId: "jada-stone", role: "competitor", tagCount: 0 }, { personId: "brooke-havok", role: "competitor", tagCount: 0 }, { personId: "odb", role: "competitor", tagCount: 0 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["b3"], factionIds: [], photoIds: [] },
  { showId: "warzone-26", matchId: "scotty-2-hotty-vs-keagan-garland", venueId: "portland-expo", personIds: ["scotty-2-hotty", "keagan-garland"], taggedPeople: [{ personId: "scotty-2-hotty", role: "competitor", tagCount: 0 }, { personId: "keagan-garland", role: "competitor", tagCount: 0 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: [], factionIds: [], photoIds: [] },
  { showId: "warzone-26", matchId: "post-match-attack-scotty-keagan-23-hazard", venueId: "portland-expo", personIds: ["scotty-2-hotty", "keagan-garland"], taggedPeople: [{ personId: "scotty-2-hotty", role: "segment", tagCount: 0 }, { personId: "keagan-garland", role: "segment", tagCount: 0 }], refereeIds: [], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: [], factionIds: ["23-hazard"], photoIds: [] },
  { showId: "warzone-26", matchId: "the-limit-vs-team-limitless", venueId: "portland-expo", personIds: ["the-limit", "team-limitless"], taggedPeople: [{ personId: "the-limit", role: "team", tagCount: 0 }, { personId: "team-limitless", role: "team", tagCount: 0 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-limit", "team-limitless"], factionIds: [], photoIds: [] },
  { showId: "gnomie-and-the-machine", matchId: "ace-romero-vs-anthony-gangone", venueId: "auburn-hall", personIds: ["ace-romero", "anthony-gangone"], taggedPeople: [{ personId: "ace-romero", role: "competitor", tagCount: 24 }, { personId: "anthony-gangone", role: "competitor", tagCount: 24 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event", "the-gangone-collective"], factionIds: ["the-mane-event", "the-gangone-collective"], photoIds: [] },
  { showId: "limitless-rumble-26", matchId: "limitless-rumble-entry-sequence", venueId: "cross-insurance-center", personIds: ["ace-romero"], taggedPeople: [{ personId: "ace-romero", role: "rumble-entry", tagCount: 64 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event"], factionIds: ["the-mane-event"], photoIds: [] },
  { showId: "massacre-in-maine", matchId: "ace-romero-and-andrew-palace-vs-alexander-james-and-aj-cruise", venueId: "portland-expo", personIds: ["ace-romero", "andrew-palace", "alexander-james", "aj-cruise"], taggedPeople: [{ personId: "ace-romero", role: "competitor", tagCount: 9 }, { personId: "andrew-palace", role: "competitor", tagCount: 9 }, { personId: "alexander-james", role: "competitor", tagCount: 9 }, { personId: "aj-cruise", role: "competitor", tagCount: 9 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"], factionIds: ["the-mane-event", "palace-guard", "the-embassy", "cruise-control"], photoIds: [] },
  { showId: "never-enough", matchId: "ace-romero-vs-alexander-james", venueId: "portland-expo", personIds: ["ace-romero", "alexander-james"], taggedPeople: [{ personId: "ace-romero", role: "competitor", tagCount: 21 }, { personId: "alexander-james", role: "competitor", tagCount: 21 }], refereeIds: ["adam-christopher"], managerIds: [], commentatorIds: ["limitless-commentary-desk"], contributorIds: ["voodoo-media"], teamIds: ["the-mane-event", "the-embassy"], factionIds: ["the-mane-event", "the-embassy"], photoIds: [] },
];

const mockMonthNumbers = {
  JAN: "01",
  FEB: "02",
  MAR: "03",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AUG: "08",
  SEP: "09",
  OCT: "10",
  NOV: "11",
  DEC: "12",
};

function createMockSlug(value, fallback = "mock-record") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

function parseMockCount(value) {
  const match = String(value ?? "").match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 0;
}

function createMockDate({ month = "", day = "", year = "", eventDate = "" } = {}) {
  const display = eventDate || [month, day, year].filter(Boolean).join(" ");
  const monthNumber = mockMonthNumbers[String(month).toUpperCase()];
  const dayNumber = String(day || "").padStart(2, "0");
  const yearText = String(year || "");
  const iso = /^\d{4}$/.test(yearText) && monthNumber && /^\d{2}$/.test(dayNumber)
    ? `${yearText}-${monthNumber}-${dayNumber}`
    : "";

  return { display, iso };
}

function createMockTitleFromSlug(value = "") {
  return String(value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function createMockVenueDetails(venueName = "", location = "", venueId = "") {
  const [city = "", state = ""] = String(location || "").split(",").map((part) => part.trim());
  const id = venueId || createMockSlug(venueName || location, "pending-venue");
  const name = venueName || "Pending Venue";

  return {
    id,
    venue_id: id,
    venue_key: id,
    name,
    venue: name,
    venue_name: name,
    city,
    state,
    country: "US",
    region: state,
    latitude: null,
    longitude: null,
    status: "static-placeholder",
    notes: "",
    geo: {
      latitude: null,
      longitude: null,
      confidence: "mock-placeholder",
    },
    location: {
      gps_lat: "",
      gps_lng: "",
    },
    media: {
      logo: "",
    },
    stats: {
      showCount: 0,
    },
    location_label: location || [city, state].filter(Boolean).join(", "),
  };
}

function mapMockTaggedPeople(taggedPeople = []) {
  return (Array.isArray(taggedPeople) ? taggedPeople : []).map((person) => ({
    id: person.personId || person.id || "",
    person_id: person.personId || person.id || "",
    role: person.role || "tagged",
    tag_count: Number(person.tagCount || person.tag_count || 0),
  }));
}

function applyMockAliases(record, aliases) {
  Object.entries(aliases).forEach(([key, value]) => {
    if (record[key] === undefined) {
      record[key] = value;
    }
  });
  return record;
}

function normalizeMockLookupValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeMockRecord(record = {}, fallback = {}) {
  const source = record && typeof record === "object" ? record : {};
  const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};
  const id = source.id || source.slug || source.bandId || source.personId || source.showId || source.venueId || source.matchId ||
    source.band_id || source.person_id || source.show_id || source.venue_id || source.match_id ||
    fallbackSource.id || fallbackSource.slug || "mock-record";
  const title = source.title || source.name || source.band || source.venue || source.venue_name || source.show_name ||
    fallbackSource.title || fallbackSource.name || createMockTitleFromSlug(id);

  return {
    ...fallbackSource,
    ...source,
    id,
    slug: source.slug || source.id || id,
    title,
    image_url: getSafeImageUrl(source.image_url || source.imageUrl || source.logo_url || source.logo || source.poster, fallbackSource.image_url || ""),
  };
}

function getMockRecordValue(record = {}, field = "") {
  if (!record || !field) {
    return "";
  }

  return field.split(".").reduce((value, key) => (value && value[key] !== undefined ? value[key] : ""), record);
}

function getMockCollection(source, options = {}) {
  const records = Array.isArray(source)
    ? source
    : Array.isArray(source?.data)
      ? source.data
      : Array.isArray(mockCollections?.[source])
        ? mockCollections[source]
        : Array.isArray(mockApiResponses?.[source]?.data)
          ? mockApiResponses[source].data
          : [];

  return options.clone === false ? records : records.slice();
}

function getMockRecordById(source, id, fields = ["id", "bandId", "personId", "showId", "venueId", "matchId", "band_id", "person_id", "show_id", "venue_id", "match_id"]) {
  const normalizedId = normalizeMockLookupValue(id);
  if (!normalizedId) {
    return null;
  }

  return getMockCollection(source, { clone: false }).find((record) => (
    fields.some((field) => normalizeMockLookupValue(getMockRecordValue(record, field)) === normalizedId)
  )) || null;
}

function getMockRecordBySlug(source, slug, fields = ["slug", "id", "bandId", "personId", "showId", "venueId", "matchId", "show_key"]) {
  return getMockRecordById(source, slug, fields);
}

function filterMockCollection(source, matcher = null) {
  const records = getMockCollection(source);
  if (!matcher) {
    return records;
  }
  if (typeof matcher === "function") {
    return records.filter(matcher);
  }
  if (typeof matcher !== "object") {
    return records;
  }

  return records.filter((record) => Object.entries(matcher).every(([field, expected]) => {
    const value = getMockRecordValue(record, field);
    if (Array.isArray(expected)) {
      return expected.map(normalizeMockLookupValue).includes(normalizeMockLookupValue(value));
    }
    return normalizeMockLookupValue(value) === normalizeMockLookupValue(expected);
  }));
}

function sortMockCollection(source, sorter = "title", direction = "asc") {
  const records = getMockCollection(source);
  const sortDirection = String(direction).toLowerCase() === "desc" ? -1 : 1;
  if (typeof sorter === "function") {
    return records.sort(sorter);
  }

  return records.sort((left, right) => {
    const leftValue = getMockRecordValue(left, sorter);
    const rightValue = getMockRecordValue(right, sorter);
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * sortDirection;
    }
    return String(leftValue || "").localeCompare(String(rightValue || "")) * sortDirection;
  });
}

function getSafeImageUrl(imageUrl = "", fallbackUrl = galleryImageFallbackSrc) {
  const safeUrl = String(imageUrl || "").trim();
  return safeUrl || fallbackUrl || "";
}

const mockStateCopy = {
  loading: {
    title: "Syncing Archive",
    text: "Preparing static records for this V3 surface.",
  },
  empty: {
    title: "No Records Staged",
    text: "This archive lane is ready, but no mock rows are currently available.",
  },
  error: {
    title: "Archive Signal Interrupted",
    text: "Static data could not be prepared. Return to the parent archive and try again.",
  },
  partial: {
    title: "Partial Signal",
    text: "Some records are staged while the remaining data waits for integration.",
  },
};

const mockStateScopeCopy = {
  routeNotFound: {
    empty: { title: "Archive Route Not Found", text: "No matching archive route could be found." },
  },
  musicRouteNotFound: {
    empty: { title: "Music Route Not Found", text: "No matching Music archive route could be found." },
  },
  wrestlingRouteNotFound: {
    empty: { title: "Ring Archive Route Not Found", text: "No matching Wrestling archive route could be found." },
  },
  musicBands: {
    loading: { title: "Scanning Band Index", text: "Preparing artist rows and archive status." },
    empty: { title: "No Bands Matched", text: "Adjust the signal filter or return to the full Music Nexus." },
    error: { title: "Band Index Offline", text: "Use the Music Nexus landing while this lane recovers." },
    partial: { title: "Partial Band Index", text: "Some band rows are staged; deeper archive links may be pending." },
  },
  musicShows: {
    loading: { title: "Loading Show Dossiers", text: "Preparing event cards and venue relationships." },
    empty: { title: "No Shows Found", text: "This year filter has no staged show records." },
    error: { title: "Show Archive Offline", text: "Return to Music Nexus or try another show lane." },
    partial: { title: "Partial Show Archive", text: "Some event records are staged without final media counts." },
  },
  musicPeople: {
    loading: { title: "Loading People Index", text: "Preparing performers, roles, and tagged-show links." },
    empty: { title: "No People Staged", text: "The people lane is ready for artist records." },
    error: { title: "People Index Offline", text: "Return to Music Nexus while this lane recovers." },
    partial: { title: "Partial People Index", text: "Some people records are staged without final tagged-show data." },
  },
  musicVenues: {
    loading: { title: "Loading Venue Grid", text: "Preparing venue cards and linked-show relationships." },
    empty: { title: "No Venues Staged", text: "The venue lane is ready for archive records." },
    error: { title: "Venue Archive Offline", text: "Return to Music Nexus while this lane recovers." },
    partial: { title: "Partial Venue Archive", text: "Some venues are staged without final linked-show rollups." },
  },
  wrestlingPeople: {
    loading: { title: "Loading Roster Grid", text: "Preparing people, aliases, and relationship hooks." },
    empty: { title: "No People Staged", text: "The roster lane is ready for records." },
    error: { title: "Roster Signal Offline", text: "Return to Ring Archive while this lane recovers." },
    partial: { title: "Partial Roster Signal", text: "Some profiles are staged; relationship data may be incomplete." },
  },
  wrestlingVenues: {
    loading: { title: "Loading Venue Grid", text: "Preparing venue cards and event relationships." },
    empty: { title: "No Venues Staged", text: "The venue lane is ready for records." },
    error: { title: "Venue Signal Offline", text: "Return to Ring Archive while this lane recovers." },
    partial: { title: "Partial Venue Signal", text: "Some venues are staged without final event rollups." },
  },
  about: {
    loading: { title: "Loading About Profile", text: "Preparing static profile copy for the shell." },
    empty: { title: "About Profile Pending", text: "The About shell is ready for managed profile content." },
    error: { title: "About Profile Offline", text: "Static site navigation remains available while profile content recovers." },
    partial: { title: "Partial About Profile", text: "Core profile copy is staged; richer site details can be integrated later." },
  },
  calendar: {
    loading: { title: "Loading Calendar", text: "Preparing upcoming archive dates." },
    empty: { title: "Calendar Clear", text: "No upcoming mock events are staged." },
    error: { title: "Calendar Signal Offline", text: "The site remains available while schedule data recovers." },
    partial: { title: "Partial Calendar", text: "Some upcoming dates are staged without final status." },
  },
  contact: {
    loading: { title: "Preparing Contact Relay", text: "Checking the static form surface." },
    empty: { title: "Contact Form Pending", text: "The form shell is present and awaiting integration." },
    error: { title: "Contact Relay Offline", text: "Use another contact method while this form remains static." },
    partial: { title: "Partial Contact Relay", text: "The form shell is staged, but submission is not connected yet." },
  },
};

// Future API adapters should hydrate these static surfaces only after route/nav state has already selected the shell.
const siteModuleIntegrationPlaceholders = Object.freeze({
  calendar: Object.freeze({
    source: "static-calendar-placeholder",
    states: Object.freeze(["loading", "empty", "error", "partial"]),
    selectors: Object.freeze({
      shell: "[data-calendar-shell]",
      surface: "[data-calendar-event-list]",
    }),
    recordShape: Object.freeze(["title", "availability", "status"]),
  }),
  about: Object.freeze({
    source: "static-about-copy",
    states: Object.freeze(["loading", "empty", "error", "partial"]),
    selectors: Object.freeze({
      shell: "[data-about-shell]",
      surface: "[data-about-content-surface]",
      stateSurface: "[data-about-state-surface]",
    }),
    recordShape: Object.freeze(["heading", "bodyBlocks"]),
  }),
  contact: Object.freeze({
    source: "static-contact-shell",
    states: Object.freeze(["loading", "empty", "error", "partial"]),
    selectors: Object.freeze({
      shell: "[data-contact-shell]",
      formSurface: "[data-contact-form-shell]",
      methodsSurface: "[data-contact-methods]",
    }),
    recordShape: Object.freeze(["fields", "methods", "responseWindow"]),
  }),
});

function getForcedMockState(scope = "") {
  const params = new URLSearchParams(window.location.search || "");
  const forcedState = params.get("mockState");
  const forcedScope = params.get("mockScope") || "all";
  const state = ["loading", "empty", "error", "partial"].includes(forcedState) ? forcedState : "";
  if (!state) {
    return "";
  }
  if (forcedScope !== "all" && forcedScope !== scope) {
    return "";
  }
  return state;
}

function getMockStateCopy(stateName = "empty", scope = "", overrides = {}) {
  return {
    ...mockStateCopy[stateName],
    ...(mockStateScopeCopy[scope]?.[stateName] || {}),
    ...overrides,
  };
}

function createMockStateCard(stateName = "empty", scope = "", overrides = {}) {
  const copy = getMockStateCopy(stateName, scope, overrides);
  const card = document.createElement("div");
  card.className = `mock-state-card mock-state-card--${stateName}`;
  card.setAttribute("role", stateName === "error" ? "alert" : "status");
  card.setAttribute("aria-live", stateName === "loading" ? "polite" : "polite");
  card.dataset.mockState = stateName;
  if (scope) {
    card.dataset.mockScope = scope;
  }

  const mark = document.createElement("span");
  mark.className = "mock-state-mark";
  mark.setAttribute("aria-hidden", "true");

  const body = document.createElement("span");
  body.className = "mock-state-copy";

  const title = document.createElement("strong");
  title.className = "mock-state-title";
  title.textContent = copy.title || mockStateCopy.empty.title;

  const text = document.createElement("span");
  text.className = "mock-state-text";
  text.textContent = copy.text || mockStateCopy.empty.text;

  body.append(title, text);
  card.append(mark, body);
  return card;
}

function renderMockState(container, stateName = "empty", scope = "", options = {}) {
  if (!container || !stateName) {
    return null;
  }

  if (options.clear !== false) {
    container.replaceChildren();
  }

  const stateElement = createMockStateCard(stateName, scope, options.copy || {});
  const wrapperTag = options.itemTag || "";
  if (wrapperTag) {
    const wrapper = document.createElement(wrapperTag);
    wrapper.className = options.itemClass || "mock-state-item";
    wrapper.append(stateElement);
    container.append(wrapper);
    return wrapper;
  }

  container.append(stateElement);
  return stateElement;
}

const v3StateNames = Object.freeze(["loading", "empty", "error"]);

const v3StateCopy = Object.freeze({
  loading: Object.freeze({
    title: "Loading Archive",
    text: "Preparing this V3 archive lane.",
  }),
  empty: Object.freeze({
    title: "No Records Found",
    text: "This surface is ready, but no matching records are available.",
  }),
  error: Object.freeze({
    title: "Archive Unavailable",
    text: "This surface could not load. Try again or return to the parent archive.",
  }),
});

function normalizeV3StateName(stateName = "empty") {
  const normalizedStateName = String(stateName || "").trim().toLowerCase();
  return v3StateNames.includes(normalizedStateName) ? normalizedStateName : "empty";
}

function getV3StateCopy(stateName = "empty", options = {}) {
  const normalizedStateName = normalizeV3StateName(stateName);
  const scope = String(options.scope || "").trim();
  const scopedCopy = scope && mockStateScopeCopy[scope]?.[normalizedStateName]
    ? mockStateScopeCopy[scope][normalizedStateName]
    : {};
  const optionCopy = options.copy && typeof options.copy === "object" && !Array.isArray(options.copy)
    ? options.copy
    : {};
  const optionText = typeof options.copy === "string" ? options.copy : "";

  return {
    title: options.title || optionCopy.title || scopedCopy.title || v3StateCopy[normalizedStateName].title,
    text: options.text || options.message || optionText || optionCopy.text || optionCopy.copy || scopedCopy.text || v3StateCopy[normalizedStateName].text,
    detail: options.detail || options.details || optionCopy.detail || optionCopy.details || "",
  };
}

function getV3StateVariants(options = {}) {
  const variant = String(options.variant || "").trim().toLowerCase();
  return {
    isSmall: Boolean(options.small || options.isSmall || variant === "small"),
    isDetail: Boolean(options.detail || options.details || options.isDetail || variant === "detail"),
  };
}

function getV3StateRetry(options = {}) {
  const retryOptions = options.retry && typeof options.retry === "object" ? options.retry : {};
  const onRetry = typeof options.onRetry === "function"
    ? options.onRetry
    : typeof options.retry === "function"
      ? options.retry
      : typeof retryOptions.onClick === "function"
        ? retryOptions.onClick
        : typeof retryOptions.action === "function"
          ? retryOptions.action
          : null;

  if (!onRetry) {
    return null;
  }

  return {
    label: options.retryLabel || options.actionLabel || retryOptions.label || "Retry",
    ariaLabel: options.retryAriaLabel || retryOptions.ariaLabel || "",
    onRetry,
  };
}

function appendV3StateDetail(body, detail) {
  const detailItems = Array.isArray(detail)
    ? detail.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

  if (detailItems.length > 0) {
    const list = document.createElement("ul");
    list.className = "v3-state-detail-list";
    detailItems.forEach((item) => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      list.append(listItem);
    });
    body.append(list);
    return;
  }

  const detailText = String(detail || "").trim();
  if (!detailText) {
    return;
  }

  const detailNode = document.createElement("span");
  detailNode.className = "v3-state-detail";
  detailNode.textContent = detailText;
  body.append(detailNode);
}

function createV3StateCard(stateName = "empty", options = {}) {
  const normalizedStateName = normalizeV3StateName(stateName);
  const copy = getV3StateCopy(normalizedStateName, options);
  const variants = getV3StateVariants({ ...options, detail: copy.detail });
  const retry = getV3StateRetry(options);
  const scope = String(options.scope || "").trim();
  const card = document.createElement("div");
  card.className = [
    "v3-state-card",
    `v3-state-card--${normalizedStateName}`,
    variants.isSmall ? "v3-state-card--small" : "",
    variants.isDetail ? "v3-state-card--detail" : "",
    retry ? "v3-state-card--has-action" : "",
  ].filter(Boolean).join(" ");
  card.dataset.v3State = normalizedStateName;
  card.setAttribute("role", normalizedStateName === "error" ? "alert" : "status");
  card.setAttribute("aria-live", normalizedStateName === "error" ? "assertive" : "polite");
  card.setAttribute("aria-busy", String(normalizedStateName === "loading"));
  if (scope) {
    card.dataset.v3StateScope = scope;
  }

  const mark = document.createElement("span");
  mark.className = "v3-state-mark";
  mark.setAttribute("aria-hidden", "true");

  const body = document.createElement("span");
  body.className = "v3-state-copy";

  const title = document.createElement("strong");
  title.className = "v3-state-title";
  title.textContent = copy.title;

  const text = document.createElement("span");
  text.className = "v3-state-text";
  text.textContent = copy.text;

  body.append(title, text);
  appendV3StateDetail(body, copy.detail);

  if (retry) {
    const actions = document.createElement("span");
    actions.className = "v3-state-actions";

    const retryButton = document.createElement("button");
    retryButton.className = "v3-state-action";
    retryButton.type = "button";
    retryButton.textContent = retry.label;
    if (retry.ariaLabel) {
      retryButton.setAttribute("aria-label", retry.ariaLabel);
    }
    retryButton.addEventListener("click", retry.onRetry);
    actions.append(retryButton);
    body.append(actions);
  }

  card.append(mark, body);
  return card;
}

function renderV3State(container, stateName = "empty", options = {}) {
  if (!container) {
    return null;
  }

  if (options.clear !== false) {
    container.replaceChildren();
  }

  const stateElement = createV3StateCard(stateName, options);
  const wrapperTag = options.itemTag || "";
  if (wrapperTag) {
    const wrapper = document.createElement(wrapperTag);
    wrapper.className = options.itemClass || "v3-state-item";
    wrapper.append(stateElement);
    container.append(wrapper);
    return wrapper;
  }

  container.append(stateElement);
  return stateElement;
}

function createV3LoadingState(options = {}) {
  return createV3StateCard("loading", options);
}

function createV3EmptyState(options = {}) {
  return createV3StateCard("empty", options);
}

function createV3ErrorState(options = {}) {
  return createV3StateCard("error", options);
}

function renderV3LoadingState(container, options = {}) {
  return renderV3State(container, "loading", options);
}

function renderV3EmptyState(container, options = {}) {
  return renderV3State(container, "empty", options);
}

function renderV3ErrorState(container, options = {}) {
  return renderV3State(container, "error", options);
}

function mapMockPeopleRefs(ids = []) {
  return (Array.isArray(ids) ? ids : []).map((id) => {
    const person = wrestlingPeopleRows.find((row) => row.personId === id) || musicPeopleRows.find((row) => row.personId === id);
    return {
      id,
      slug: id,
      name: person?.name || createMockTitleFromSlug(id),
    };
  });
}

function mapMockMusicBandRefs(names = []) {
  return (Array.isArray(names) ? names : []).filter(Boolean).map((name) => ({
    band_id: createMockSlug(name, "pending-band"),
    band: name,
    instrument: "",
  }));
}

function getMockWrestlingVenue(venueId = "") {
  return wrestlingVenueRows.find((venue) => venue.venueId === venueId) || null;
}

function createMockWrestlingMatchRecord(match, index = 0) {
  const participantRefs = mapMockPeopleRefs(match.personIds || []);
  const refereeRefs = mapMockPeopleRefs(match.refereeIds || []);
  const extraPeople = mapMockPeopleRefs([
    ...(match.managerIds || []),
    ...(match.commentatorIds || []),
    ...(match.contributorIds || []),
  ]);

  return {
    match_id: match.matchId,
    match_order: index + 1,
    match_name: match.matchName || createMockTitleFromSlug(match.matchId),
    match_type: match.matchType || "",
    show_id: match.showId,
    venue_id: match.venueId,
    side_1: participantRefs.slice(0, Math.ceil(participantRefs.length / 2)),
    side_2: participantRefs.slice(Math.ceil(participantRefs.length / 2)),
    participants: participantRefs,
    extra_people: extraPeople,
    winner: [],
    winners: [],
    referees: refereeRefs,
    tagged_people: mapMockTaggedPeople(match.taggedPeople),
    photo_ids: Array.isArray(match.photoIds) ? match.photoIds : [],
    stats: {
      photoCount: Number(match.photoIds?.length || 0),
      participantCount: participantRefs.length,
    },
  };
}

function createMockApiEnvelope(route, source, data, stats = {}) {
  const count = Array.isArray(data) ? data.length : 0;

  return {
    ok: true,
    route,
    source,
    generatedAt: "2026-01-01T00:00:00.000Z",
    generatedTime: "Mock Static",
    count,
    total: count,
    page: 1,
    limit: count || 1,
    totalPages: count ? 1 : 0,
    hasNextPage: false,
    hasPrevPage: false,
    filters: {},
    sort: {},
    meta: {
      route,
      source,
      pagination: {
        count,
        total: count,
        page: 1,
        limit: count || 1,
        totalPages: count ? 1 : 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
      warnings: ["Static frontend mock response; not wired to the live API."],
    },
    stats,
    data,
  };
}

function createMockStatsEnvelope(route, source, stats = {}) {
  return {
    ok: true,
    route,
    source,
    generatedAt: "2026-01-01T00:00:00.000Z",
    generatedTime: "Mock Static",
    ...stats,
    stats,
  };
}

function standardizeMusicMockRows() {
  musicBandIndexRows.forEach((band, index) => {
    const bandId = band.bandId;
    const photoCount = Number(band.photos || band.albums || 0);
    const backendRecord = {
      band: band.name,
      band_id: bandId,
      general: {
        name: band.name,
        smug_folder: "",
        logo_url: "",
        status: band.status,
        tags: [band.region].filter(Boolean),
        notes: "",
      },
      personnel: {
        members: [],
        past_members: [],
      },
      stats: {
        region: band.region,
        location: "",
        state: "",
        country: "US",
        totalPhotos: photoCount,
        archived_sets: photoCount,
        total_sets: photoCount,
      },
    };

    applyMockAliases(band, {
      id: bandId,
      band_id: bandId,
      slug: bandId,
      title: band.name,
      category: band.region,
      photo_count: photoCount,
      smug_folder: "",
      logo_url: "",
      general: backendRecord.general,
      personnel: backendRecord.personnel,
      stats: backendRecord.stats,
      backend_record: backendRecord,
      raw_sheet: { mock_row: index + 1 },
      image_url: null,
      related_people: [],
      related_shows: [],
    });
  });

  musicPeopleRows.forEach((person, index) => {
    const personId = index + 1;
    const bandRefs = mapMockMusicBandRefs(person.band ? [person.band] : []);
    const backendRecord = {
      person_id: personId,
      name: person.name,
      category: person.role,
      aliases: [],
      bands: bandRefs,
      associations: [],
      stats: {
        showCount: Number(person.sets || 0),
        taggedPhotoCount: Number(person.photos || 0),
      },
    };

    applyMockAliases(person, {
      id: person.personId,
      person_id: personId,
      slug: person.personId,
      title: person.name,
      category: person.role,
      photo_count: Number(person.photos || 0),
      aliases: [],
      bands: bandRefs,
      associations: [],
      stats: backendRecord.stats,
      backend_record: backendRecord,
      related_people: [],
      related_shows: [],
      related_bands: bandRefs,
      image_url: null,
    });
  });

  musicShowsArchiveRows.forEach((show, index) => {
    const bandCount = parseMockCount(show.bandCount);
    const date = createMockDate(show);
    const venueDetails = createMockVenueDetails(show.venue, show.location);
    const bands = musicBandIndexRows.slice(0, bandCount).map((band) => ({
      band_id: band.band_id || band.bandId,
      band: band.name,
    }));
    const backendRecord = {
      show_id: index + 1,
      name: show.title,
      venue_id: venueDetails.venue_id,
      venue: show.venue,
      venue_details: venueDetails,
      city: venueDetails.city,
      state: venueDetails.state,
      date: date.iso || date.display,
      poster: show.poster,
      notes: "",
      camera_1: "",
      camera_2: "",
      bands,
      stats: { bandCount },
    };

    applyMockAliases(show, {
      id: show.showId,
      show_id: index + 1,
      slug: show.showId,
      date,
      status: "static-placeholder",
      category: "music-show",
      photo_count: Math.max(48, bandCount * 54),
      venue_id: venueDetails.venue_id,
      venue_details: venueDetails,
      bands,
      stats: backendRecord.stats,
      backend_record: backendRecord,
      related_people: [],
      related_shows: [show.showId],
      image_url: null,
    });
  });

  applyMockAliases(musicPersonDetailPlaceholder, {
    id: musicPersonDetailPlaceholder.personId,
    slug: musicPersonDetailPlaceholder.personId,
    title: musicPersonDetailPlaceholder.name,
    category: "music-person-detail",
    photo_count: parseMockCount(musicPersonDetailPlaceholder.summaryItems?.find((item) => /photo/i.test(item))),
    related_people: [musicPersonDetailPlaceholder.personId],
    related_shows: musicPersonDetailPlaceholder.taggedShows.map((show) => show.showId),
    image_url: null,
  });

  musicPersonDetailPlaceholder.taggedShows.forEach((show, index) => {
    const date = createMockDate(show.date);
    const venueDetails = createMockVenueDetails(show.venue, show.location);
    const bands = mapMockMusicBandRefs(musicPersonDetailPlaceholder.associatedBands);

    applyMockAliases(show, {
      id: show.showId,
      show_id: index + 1,
      slug: show.showId,
      date,
      status: "static-placeholder",
      category: "music-tagged-show",
      photo_count: Number(show.taggedPhotos || 0),
      venue_id: venueDetails.venue_id,
      venue_details: venueDetails,
      bands,
      stats: { bandCount: bands.length },
      backend_record: {
        show_id: index + 1,
        name: show.title,
        venue_id: venueDetails.venue_id,
        venue: show.venue,
        venue_details: venueDetails,
        city: venueDetails.city,
        state: venueDetails.state,
        date: date.iso || date.display,
        poster: show.thumb,
        notes: show.notes || "",
        camera_1: "",
        camera_2: "",
        bands,
        stats: { bandCount: bands.length },
      },
      related_people: [musicPersonDetailPlaceholder.personId],
      related_shows: [show.showId],
      image_url: null,
    });
  });
}

function standardizeWrestlingMockRows() {
  wrestlingPeopleRows.forEach((person, index) => {
    const backendRecord = {
      id: index + 1,
      slug: person.personId,
      name: person.name,
      category: person.role,
      aliases: Array.isArray(person.aliases) ? person.aliases : [],
      teams: person.teamIds || [],
      notes: person.factionTeam || "",
    };

    applyMockAliases(person, {
      id: person.personId,
      person_numeric_id: index + 1,
      slug: person.personId,
      title: person.name,
      status: "static-placeholder",
      category: person.role,
      photo_count: Number(person.photos || 0),
      teams: person.teamIds || [],
      notes: person.factionTeam || "",
      stats: {
        matchCount: Number(person.matches || 0),
        taggedPhotoCount: Number(person.photos || 0),
      },
      backend_record: backendRecord,
      related_people: person.personId ? [person.personId] : [],
      related_shows: person.showIds || [],
      image_url: null,
    });
  });

  wrestlingVenueRows.forEach((venue) => {
    const venueDetails = createMockVenueDetails(venue.name, `${venue.city}, ${venue.state}`, venue.venueId);
    venueDetails.region = venue.region;
    venueDetails.stats.showCount = Number(venue.eventCount || 0);

    applyMockAliases(venue, {
      id: venue.venueId,
      venue_id: venue.venueId,
      venue_name: venue.name,
      slug: venue.venueId,
      title: venue.name,
      status: venue.archiveState || "static-placeholder",
      category: "wrestling-venue",
      photo_count: Number(venue.photoCount || 0),
      venue_type: "archive-venue",
      latitude: null,
      longitude: null,
      geo: venueDetails.geo,
      venue_details: venueDetails,
      backend_record: {
        venue_id: venue.venueId,
        venue_name: venue.name,
        city: venue.city,
        state: venue.state,
        country: "US",
        region: venue.region,
        venue_type: "archive-venue",
        status: venue.archiveState || "static-placeholder",
        latitude: null,
        longitude: null,
        notes: "",
        geo: venueDetails.geo,
      },
      related_people: [],
      related_shows: venue.showIds || [],
      image_url: null,
    });
  });

  [
    ...wrestlingPersonEventHistoryRows,
    ...wrestlingVenueEventHistoryRows,
    ...wrestlingShowRelationshipRows,
  ].forEach((eventRow) => {
    const venue = getMockWrestlingVenue(eventRow.venueId);
    const venueDetails = createMockVenueDetails(venue?.name || "", venue ? `${venue.city}, ${venue.state}` : "", eventRow.venueId);
    const date = createMockDate({ eventDate: eventRow.eventDate });
    const matchRows = (eventRow.matchIds || [])
      .map((matchId) => wrestlingMatchRelationshipRows.find((match) => match.matchId === matchId))
      .filter(Boolean)
      .map(createMockWrestlingMatchRecord);
    const backendRecord = {
      show_id: eventRow.show_id || eventRow.showId || eventRow.eventId,
      show_key: eventRow.showId || eventRow.eventId,
      promotion: eventRow.promotion || "Limitless Wrestling",
      show_name: eventRow.eventName || createMockTitleFromSlug(eventRow.showId || eventRow.eventId),
      date: date.iso || eventRow.eventDate || "",
      venue_id: eventRow.venueId || "",
      venue: venue?.name || "",
      venue_details: venueDetails,
      city: venue?.city || "",
      state: venue?.state || "",
      poster: "",
      camera_1: "",
      camera_2: "",
      matches: matchRows,
      stats: {
        matchCount: matchRows.length,
        participantCount: new Set(eventRow.personIds || []).size,
      },
    };

    applyMockAliases(eventRow, {
      id: eventRow.eventId || eventRow.showId,
      show_id: eventRow.showId || eventRow.eventId,
      show_key: eventRow.showId || eventRow.eventId,
      slug: eventRow.eventId || eventRow.showId,
      title: eventRow.eventName || eventRow.showId,
      date,
      status: "static-placeholder",
      category: "wrestling-show",
      photo_count: Number(eventRow.photoCount || eventRow.photoIds?.length || 0),
      venue_details: venueDetails,
      matches: matchRows,
      participants: mapMockPeopleRefs(eventRow.personIds || []),
      winners: [],
      winner: [],
      referees: mapMockPeopleRefs(eventRow.refereeIds || []),
      stats: backendRecord.stats,
      backend_record: backendRecord,
      related_people: eventRow.personIds || [],
      related_shows: eventRow.showId ? [eventRow.showId] : [],
      tagged_people: mapMockTaggedPeople(eventRow.taggedPeople),
      image_url: null,
    });
  });

  wrestlingMatchRelationshipRows.forEach((match, index) => {
    const backendRecord = createMockWrestlingMatchRecord(match, index);

    applyMockAliases(match, {
      id: match.matchId,
      match_id: match.matchId,
      match_order: index + 1,
      slug: match.matchId,
      title: match.matchName || match.matchId,
      status: "static-placeholder",
      category: "wrestling-match",
      photo_count: Number(match.photoIds?.length || 0),
      venue_details: createMockVenueDetails("", "", match.venueId),
      participants: backendRecord.participants,
      extra_people: backendRecord.extra_people,
      winners: backendRecord.winners,
      winner: backendRecord.winner,
      referees: backendRecord.referees,
      photo_ids: backendRecord.photo_ids,
      stats: backendRecord.stats,
      backend_record: backendRecord,
      related_people: match.personIds || [],
      related_shows: match.showId ? [match.showId] : [],
      tagged_people: mapMockTaggedPeople(match.taggedPeople),
      image_url: null,
    });
  });
}

// Compatibility aliases let legacy render code keep camelCase fields while
// future mock/API adapters can read stable backend-friendly names. Pass 3 adds
// backend_record and mock API envelopes without connecting to live endpoints.
standardizeMusicMockRows();
standardizeWrestlingMockRows();

const musicVenuesDbMockRows = Array.from(
  new Map(musicShowsArchiveRows.map((show) => [show.venue_details.venue_id, show.venue_details])).values()
).map((venue) => ({
  venue_id: venue.venue_id,
  venue: venue.venue,
  city: venue.city,
  state: venue.state,
  country: venue.country,
  region: venue.region,
  logo: "",
  latitude: null,
  longitude: null,
  status: venue.status,
  notes: "",
  geo: venue.geo,
  description: "",
  location: venue.location,
  media: venue.media,
  stats: venue.stats,
}));

const musicBandsStatsMock = {
  bandsTotal: musicBandIndexRows.length,
  completeArchive: musicBandIndexRows.filter((band) => band.statusKey === "complete").length,
  partialArchive: musicBandIndexRows.filter((band) => band.statusKey === "partial").length,
  needsWork: musicBandIndexRows.filter((band) => band.statusKey === "needs").length,
  totalPhotos: musicBandIndexRows.reduce((sum, band) => sum + Number(band.photo_count || 0), 0),
};
const musicPeopleStatsMock = {
  peopleTotal: musicPeopleRows.length,
  performersTotal: musicPeopleRows.length,
  friendsTotal: 0,
  categoriesTotal: new Set(musicPeopleRows.map((person) => person.category).filter(Boolean)).size,
  uniqueBands: new Set(musicPeopleRows.flatMap((person) => (person.related_bands || []).map((band) => band.band))).size,
};
const musicShowsStatsMock = {
  showsTotal: musicShowsArchiveRows.length,
  bandsTotal: musicBandIndexRows.length,
  venuesTotal: musicVenuesDbMockRows.length,
  totalBandSlots: musicShowsArchiveRows.reduce((sum, show) => sum + Number(show.stats?.bandCount || 0), 0),
};
const musicVenuesStatsMock = {
  venuesTotal: musicVenuesDbMockRows.length,
  citiesTotal: new Set(musicVenuesDbMockRows.map((venue) => venue.city).filter(Boolean)).size,
  statesTotal: new Set(musicVenuesDbMockRows.map((venue) => venue.state).filter(Boolean)).size,
};
const wrestlingShowsStatsMock = {
  showsTotal: wrestlingShowRelationshipRows.length,
  matchesTotal: wrestlingMatchRelationshipRows.length,
};
const wrestlingPeopleStatsMock = {
  peopleTotal: wrestlingPeopleRows.length,
  wrestlersTotal: wrestlingPeopleRows.filter((person) => /wrestler/i.test(person.category)).length,
  refereesTotal: wrestlingPeopleRows.filter((person) => /referee/i.test(person.category)).length,
  withTeams: wrestlingPeopleRows.filter((person) => person.teams?.length).length,
  uniqueTeams: new Set(wrestlingPeopleRows.flatMap((person) => person.teams || [])).size,
};
const wrestlingVenuesStatsMock = {
  venuesTotal: wrestlingVenueRows.length,
  citiesTotal: new Set(wrestlingVenueRows.map((venue) => venue.city).filter(Boolean)).size,
  statesTotal: new Set(wrestlingVenueRows.map((venue) => venue.state).filter(Boolean)).size,
};

const mockApiResponses = {
  "/api/music/bands/db": createMockApiEnvelope(
    "/api/music/bands/db",
    "PostgreSQL:music_bands",
    musicBandIndexRows.map((band) => band.backend_record),
    musicBandsStatsMock
  ),
  "/api/music/bands/stats": createMockStatsEnvelope(
    "/api/music/bands/stats",
    "PostgreSQL:music_bands",
    musicBandsStatsMock
  ),
  "/api/music/people/db": createMockApiEnvelope(
    "/api/music/people/db",
    { type: "postgres", table: "music_people" },
    musicPeopleRows.map((person) => person.backend_record),
    musicPeopleStatsMock
  ),
  "/api/music/people/stats": createMockStatsEnvelope(
    "/api/music/people/stats",
    { type: "postgres", table: "music_people" },
    musicPeopleStatsMock
  ),
  "/api/music/shows/db": createMockApiEnvelope(
    "/api/music/shows/db",
    "PostgreSQL:music_shows",
    musicShowsArchiveRows.map((show) => show.backend_record),
    musicShowsStatsMock
  ),
  "/api/music/shows/stats": createMockStatsEnvelope(
    "/api/music/shows/stats",
    "PostgreSQL:music_shows",
    musicShowsStatsMock
  ),
  "/api/music/venues/db": createMockApiEnvelope(
    "/api/music/venues/db",
    { type: "postgres", table: "music_venues" },
    musicVenuesDbMockRows,
    musicVenuesStatsMock
  ),
  "/api/music/venues/stats": createMockStatsEnvelope(
    "/api/music/venues/stats",
    { type: "postgres", table: "music_venues" },
    musicVenuesStatsMock
  ),
  "/api/wrestling/shows/db": createMockApiEnvelope(
    "/api/wrestling/shows/db",
    "PostgreSQL:wrestling_shows",
    wrestlingShowRelationshipRows.map((show) => show.backend_record),
    wrestlingShowsStatsMock
  ),
  "/api/wrestling/shows/stats": createMockStatsEnvelope(
    "/api/wrestling/shows/stats",
    "PostgreSQL:wrestling_shows",
    wrestlingShowsStatsMock
  ),
  "/api/wrestling/people/db": createMockApiEnvelope(
    "/api/wrestling/people/db",
    { type: "postgres", table: "wrestling_people" },
    wrestlingPeopleRows.map((person) => person.backend_record),
    wrestlingPeopleStatsMock
  ),
  "/api/wrestling/people/stats": createMockStatsEnvelope(
    "/api/wrestling/people/stats",
    { type: "postgres", table: "wrestling_people" },
    wrestlingPeopleStatsMock
  ),
  "/api/wrestling/venues/db": createMockApiEnvelope(
    "/api/wrestling/venues/db",
    { type: "postgres", table: "wrestling_venues" },
    wrestlingVenueRows.map((venue) => venue.backend_record),
    wrestlingVenuesStatsMock
  ),
  "/api/wrestling/venues/stats": createMockStatsEnvelope(
    "/api/wrestling/venues/stats",
    { type: "postgres", table: "wrestling_venues" },
    wrestlingVenuesStatsMock
  ),
};

const mockCollections = {
  musicBands: musicBandIndexRows,
  musicPeople: musicPeopleRows,
  musicShows: musicShowsArchiveRows,
  musicVenues: musicVenuesDbMockRows,
  wrestlingPeople: wrestlingPeopleRows,
  wrestlingVenues: wrestlingVenueRows,
  wrestlingShows: wrestlingShowRelationshipRows,
  wrestlingMatches: wrestlingMatchRelationshipRows,
  wrestlingPersonEvents: wrestlingPersonEventHistoryRows,
  wrestlingVenueEvents: wrestlingVenueEventHistoryRows,
};

const bandsAlphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const radarPointOffsets = [
  ["-4.8rem", "-5.2rem"],
  ["5.1rem", "-3.7rem"],
  ["4.2rem", "4.9rem"],
  ["-5.3rem", "3.6rem"],
];
const routePaths = {
  home: "/",
  portfolio: "/portfolio",
  music: "/music",
  musicBands: "/music/bands",
  musicShows: "/music/shows",
  musicPeople: "/music/people",
  musicVenues: "/music/venues",
  wrestling: "/wrestling",
  wrestlingPeople: "/wrestling/people",
  wrestlingVenues: "/wrestling/venues",
  wrestlingShows: "/wrestling/shows",
  wrestlingShows2: "/wrestling/shows2",
  calendar: "/calendar",
  about: "/about",
  contact: "/contact",
  connect: "/connect",
};

function routeWrestlingShowsEntryPoint(event) {
  if (!ringArchiveShows || ringArchiveShows.disabled || ringArchiveShows.getAttribute("aria-disabled") === "true") {
    return;
  }

  event.preventDefault();
  event.stopImmediatePropagation();
  navigateToRoute(routePaths.wrestlingShows2);
}

if (ringArchiveShows) {
  ringArchiveShows.addEventListener("click", routeWrestlingShowsEntryPoint, { capture: true });
}

const shellDrawerGroups = [
  { id: "shell", label: "Shell" },
  { id: "music", label: "The Music Nexus" },
  { id: "wrestling", label: "The Ring Archive" },
  { id: "site", label: "Site" },
  { id: "future", label: "Future Modules" },
];

const globalDrawerRouteIds = ["home", "portfolio", "music", "wrestling", "calendar", "about", "contact"];

const shellRouteRegistry = [
  {
    id: "home",
    route: routePaths.home,
    label: "Home",
    parentSection: "Shell",
    moduleType: "shell",
    drawerGroup: "shell",
    breadcrumbLabel: "Home",
    bottomRailEligible: true,
    drawerVariant: "primary",
  },
  {
    id: "portfolio",
    route: routePaths.portfolio,
    label: "Portfolio Hub",
    parentSection: "Shell",
    moduleType: "shell",
    drawerGroup: "shell",
    breadcrumbLabel: "Portfolio",
    bottomRailEligible: true,
    drawerVariant: "primary",
  },
  {
    id: "music",
    route: routePaths.music,
    label: "The Music Nexus",
    parentSection: "Portfolio",
    moduleType: "module",
    drawerGroup: "music",
    breadcrumbLabel: "Music",
    bottomRailEligible: true,
    drawerVariant: "module",
  },
  {
    id: "music-bands",
    route: routePaths.musicBands,
    label: "Bands",
    parentSection: "Music Nexus",
    moduleType: "module-index",
    drawerGroup: "music",
    breadcrumbLabel: "Bands",
    bottomRailEligible: true,
    drawerVariant: "child",
  },
  {
    id: "music-people",
    route: routePaths.musicPeople,
    label: "People",
    parentSection: "Music Nexus",
    moduleType: "module-index",
    drawerGroup: "music",
    breadcrumbLabel: "People",
    bottomRailEligible: true,
    drawerVariant: "child",
  },
  {
    id: "music-shows",
    route: routePaths.musicShows,
    label: "Shows",
    parentSection: "Music Nexus",
    moduleType: "module-index",
    drawerGroup: "music",
    breadcrumbLabel: "Shows",
    bottomRailEligible: true,
    drawerVariant: "child",
  },
  {
    id: "music-venues",
    route: routePaths.musicVenues,
    label: "Venues",
    parentSection: "Music Nexus",
    moduleType: "module-index",
    drawerGroup: "music",
    breadcrumbLabel: "Venues",
    bottomRailEligible: true,
    drawerVariant: "child",
  },
  {
    id: "wrestling",
    route: routePaths.wrestling,
    label: "Battleground",
    parentSection: "Portfolio",
    moduleType: "module",
    drawerGroup: "wrestling",
    breadcrumbLabel: "Battleground",
    bottomRailEligible: true,
    drawerVariant: "module",
  },
  {
    id: "wrestling-shows",
    route: routePaths.wrestlingShows2,
    label: "Shows",
    parentSection: "Wrestling Nexus",
    moduleType: "module-index",
    drawerGroup: "wrestling",
    breadcrumbLabel: "Shows",
    bottomRailEligible: true,
    drawerVariant: "child",
  },
  {
    id: "wrestling-matches",
    route: "",
    label: "Matches",
    parentSection: "Wrestling Nexus",
    moduleType: "module-placeholder",
    drawerGroup: "wrestling",
    breadcrumbLabel: "Matches",
    bottomRailEligible: false,
    futurePlaceholder: true,
    drawerVariant: "child",
  },
  {
    id: "wrestling-people",
    route: routePaths.wrestlingPeople,
    label: "People",
    parentSection: "Wrestling Nexus",
    moduleType: "module-index",
    drawerGroup: "wrestling",
    breadcrumbLabel: "People",
    bottomRailEligible: true,
    drawerVariant: "child",
  },
  {
    id: "calendar",
    route: routePaths.calendar,
    label: "Calendar",
    parentSection: "Site",
    moduleType: "shell",
    drawerGroup: "site",
    breadcrumbLabel: "Calendar",
    bottomRailEligible: true,
  },
  {
    id: "about",
    route: routePaths.about,
    label: "About",
    parentSection: "Site",
    moduleType: "shell",
    drawerGroup: "site",
    breadcrumbLabel: "About",
    bottomRailEligible: true,
  },
  {
    id: "contact",
    route: routePaths.contact,
    label: "Contact",
    parentSection: "Site",
    moduleType: "shell",
    drawerGroup: "site",
    breadcrumbLabel: "Contact",
    bottomRailEligible: true,
  },
  {
    id: "connect",
    route: routePaths.connect,
    label: "Connect",
    parentSection: "Site",
    moduleType: "shell",
    drawerGroup: "site",
    breadcrumbLabel: "Connect",
    bottomRailEligible: false,
  },
  {
    id: "wildlife",
    route: "",
    label: "Wildlife",
    parentSection: "Portfolio",
    moduleType: "future-module",
    drawerGroup: "future",
    breadcrumbLabel: "Wildlife",
    bottomRailEligible: false,
    futurePlaceholder: true,
  },
  {
    id: "astrophotography",
    route: "",
    label: "Astrophotography",
    parentSection: "Portfolio",
    moduleType: "future-module",
    drawerGroup: "future",
    breadcrumbLabel: "Astrophotography",
    bottomRailEligible: false,
    futurePlaceholder: true,
  },
  {
    id: "sunset",
    route: "",
    label: "Sunset",
    parentSection: "Portfolio",
    moduleType: "future-module",
    drawerGroup: "future",
    breadcrumbLabel: "Sunset",
    bottomRailEligible: false,
    futurePlaceholder: true,
  },
];

const shellRouteRegistryById = new Map(shellRouteRegistry.map((route) => [route.id, route]));

const routeNameToGlobalNavTarget = {
  home: "home",
  portfolio: "portfolio",
  "route-not-found": "portfolio",
  music: "music",
  "music-route-not-found": "music",
  "music-bands": "music",
  "band-detail": "music",
  "sets-archive": "music",
  "set-detail": "music",
  "music-people": "music",
  "person-detail": "music",
  "music-shows": "music",
  "show-detail": "music",
  "music-venues": "music",
  "music-venue-detail": "music",
  wrestling: "wrestling",
  "wrestling-route-not-found": "wrestling",
  "wrestling-shows": "wrestling",
  "wrestling-show-detail": "wrestling",
  "wrestling-match-gallery": "wrestling",
  "wrestling-lightbox": "wrestling",
  "wrestling-people": "wrestling",
  "wrestling-person-detail": "wrestling",
  "wrestling-venues": "wrestling",
  "wrestling-venue-detail": "wrestling",
  calendar: "calendar",
  about: "about",
  contact: "contact",
  connect: "connect",
};

const routeNameToBreadcrumbTrail = {
  home: ["home"],
  portfolio: ["portfolio"],
  "route-not-found": ["portfolio"],
  music: ["portfolio", "music"],
  "music-route-not-found": ["portfolio", "music"],
  "music-bands": ["portfolio", "music", "music-bands"],
  "band-detail": ["portfolio", "music", "music-bands"],
  "sets-archive": ["portfolio", "music", "music-bands"],
  "set-detail": ["portfolio", "music", "music-bands"],
  "music-people": ["portfolio", "music", "music-people"],
  "person-detail": ["portfolio", "music", "music-people"],
  "music-shows": ["portfolio", "music", "music-shows"],
  "show-detail": ["portfolio", "music", "music-shows"],
  "music-venues": ["portfolio", "music", "music-venues"],
  "music-venue-detail": ["portfolio", "music", "music-venues"],
  wrestling: ["portfolio", "wrestling"],
  "wrestling-route-not-found": ["portfolio", "wrestling"],
  "wrestling-shows": ["portfolio", "wrestling", "wrestling-shows"],
  "wrestling-show-detail": ["portfolio", "wrestling", "wrestling-shows"],
  "wrestling-match-gallery": ["portfolio", "wrestling", "wrestling-shows"],
  "wrestling-lightbox": ["portfolio", "wrestling", "wrestling-shows"],
  "wrestling-people": ["portfolio", "wrestling", "wrestling-people"],
  "wrestling-person-detail": ["portfolio", "wrestling", "wrestling-people"],
  "wrestling-venues": ["portfolio", "wrestling"],
  "wrestling-venue-detail": ["portfolio", "wrestling"],
  calendar: ["portfolio", "calendar"],
  about: ["portfolio", "about"],
  contact: ["portfolio", "contact"],
  connect: ["connect"],
};

const routeNameToDrilldownBreadcrumb = {
  "route-not-found": "Route Not Found",
  "music-route-not-found": "Route Not Found",
  "wrestling-route-not-found": "Route Not Found",
  "band-detail": "Band Detail",
  "sets-archive": "Sets Archive",
  "set-detail": "Set Detail",
  "person-detail": "Person Detail",
  "show-detail": "Show Detail",
  "music-venue-detail": "Venue Detail",
  "wrestling-person-detail": "Person Detail",
  "wrestling-venue-detail": "Venue Detail",
  "wrestling-show-detail": "Show Detail",
  "wrestling-match-gallery": "Match Gallery",
  "wrestling-lightbox": "Photo",
};

const routeNameToShellBackTarget = {
  portfolio: routePaths.home,
  "route-not-found": routePaths.portfolio,
  music: routePaths.portfolio,
  "music-route-not-found": routePaths.music,
  "music-bands": routePaths.music,
  "band-detail": routePaths.musicBands,
  "sets-archive": "",
  "set-detail": "",
  "music-people": routePaths.music,
  "person-detail": routePaths.musicPeople,
  "music-shows": routePaths.music,
  "show-detail": routePaths.musicShows,
  "music-venues": routePaths.music,
  "music-venue-detail": routePaths.musicVenues,
  wrestling: routePaths.portfolio,
  "wrestling-route-not-found": routePaths.wrestling,
  "wrestling-shows": routePaths.wrestling,
  "wrestling-show-detail": routePaths.wrestlingShows,
  "wrestling-match-gallery": "",
  "wrestling-lightbox": "",
  "wrestling-people": routePaths.wrestling,
  "wrestling-person-detail": routePaths.wrestlingPeople,
  "wrestling-venues": routePaths.wrestling,
  "wrestling-venue-detail": routePaths.wrestlingVenues,
  calendar: routePaths.portfolio,
  about: routePaths.portfolio,
  contact: routePaths.portfolio,
  connect: routePaths.home,
};
const routedBandsViews = ["radar", "list", "search"];
const mockSetCodes = [
  "102911",
  "061504",
  "110398",
  "091226",
  "020925",
  "042625",
  "071125",
  "100325",
  "121425",
  "051924",
  "082424",
  "110224",
  "091623",
];
const setDateMonthCodes = {
  JAN: "01",
  FEB: "02",
  MAR: "03",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AUG: "08",
  SEP: "09",
  OCT: "10",
  NOV: "11",
  DEC: "12",
};
const daiionArchiveStatsEndpoints = {
  shows: "https://vmpix-data.onrender.com/api/wrestling/shows/stats",
  people: "https://vmpix-data.onrender.com/api/wrestling/people/stats",
  venues: "https://vmpix-data.onrender.com/api/wrestling/venues/stats",
};
const daiionArchiveStatsStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
const daiionArchiveStatsDecodeDelay = 4580;
function isDaiionArchiveLandingPath(pathname = window.location.pathname) {
  return pathname === routePaths.wrestling;
}
const daiionArchiveStatsRowStagger = 80;
const daiionArchiveFocusBriefings = {
  campaigns: {
    title: "The Hall of Crusades",
    stat: "43 Recorded Campaigns",
    copy: "Journey through a collection of the campaigns that transpired throughout time.",
    status: "Enter the Halls",
  },
  combatants: {
    title: "The Hall of Champions",
    stat: "290 Documented Combatants",
    copy: "Explore the performers, allies, legends and more that made Daiion's legacy throughout the years.",
    status: "TARGET LOCKED",
  },
  arenas: {
    title: "The Fields of Conflict",
    stat: "9 Mapped Arenas",
    copy: "Visit the ancient battlegrounds in which each recorded conflict left its mark.",
    status: "TARGET LOCKED",
  },
};
const daiionArchiveRouteTargets = {
  campaigns: routePaths.wrestlingShows2,
};
const daiionDestinationTargets = new Set(Object.keys(daiionArchiveFocusBriefings));
let daiionArchiveStatsRequestId = 0;
let daiionDestinationSelectedTarget = null;

function syncDaiionDestinationSelection() {
  const destinationControls = Array.from(document.querySelectorAll("[data-daiion-destination-target]"));
  const statRows = Array.from(document.querySelectorAll("[data-daiion-stat-target]"));
  const planetNodes = Array.from(document.querySelectorAll("[data-daiion-planet-node]"));
  const energyRoutes = Array.from(document.querySelectorAll("[data-daiion-energy-route]"));
  const panel = document.querySelector(".daiion-destination-panel");
  const focusPanel = document.querySelector("[data-daiion-archive-focus]");
  const focusBriefing = daiionArchiveFocusBriefings[daiionDestinationSelectedTarget];
  const focusRoute = daiionArchiveRouteTargets[daiionDestinationSelectedTarget] || "";

  destinationControls.forEach((control) => {
    const isActive = control.getAttribute("data-daiion-destination-target") === daiionDestinationSelectedTarget;
    control.classList.toggle("is-active", isActive);
    control.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  statRows.forEach((row) => {
    const isActive = row.getAttribute("data-daiion-stat-target") === daiionDestinationSelectedTarget;
    row.classList.toggle("is-active", isActive);
    row.setAttribute("aria-current", isActive ? "true" : "false");
  });

  planetNodes.forEach((node) => {
    const isActive = node.getAttribute("data-daiion-planet-node") === daiionDestinationSelectedTarget;
    node.classList.toggle("is-active", isActive);
  });

  energyRoutes.forEach((route) => {
    const isActive = route.getAttribute("data-daiion-energy-route") === daiionDestinationSelectedTarget;
    route.classList.toggle("is-active", isActive);
  });

  if (focusPanel) {
    const titleNode = focusPanel.querySelector(".daiion-archive-focus-panel__title");
    const statNode = focusPanel.querySelector("[data-daiion-archive-focus-stat]");
    const copyNode = focusPanel.querySelector("[data-daiion-archive-focus-copy]");
    const statusNode = focusPanel.querySelector("[data-daiion-archive-focus-status]");

    if (focusBriefing) {
      titleNode.textContent = focusBriefing.title || "ARCHIVE FOCUS";
      statNode.textContent = focusBriefing.stat;
      copyNode.textContent = focusBriefing.copy;
      statusNode.textContent = focusBriefing.status;
      focusPanel.classList.add("is-active");
      focusPanel.classList.toggle("is-routeable", Boolean(focusRoute));
      focusPanel.setAttribute("aria-hidden", "false");
      focusPanel.setAttribute("data-daiion-selected-target", daiionDestinationSelectedTarget);
      if (focusRoute) {
        focusPanel.setAttribute("role", "button");
        focusPanel.setAttribute("tabindex", "0");
        focusPanel.setAttribute("data-daiion-route-target", focusRoute);
        focusPanel.setAttribute("aria-label", `${focusBriefing.title} - ${focusBriefing.status}`);
      } else {
        focusPanel.removeAttribute("role");
        focusPanel.removeAttribute("tabindex");
        focusPanel.removeAttribute("data-daiion-route-target");
        focusPanel.setAttribute("aria-label", "Archive Focus");
      }
    } else {
      titleNode.textContent = "ARCHIVE FOCUS";
      statNode.textContent = "";
      copyNode.textContent = "";
      statusNode.textContent = "";
      focusPanel.classList.remove("is-active", "is-routeable");
      focusPanel.setAttribute("aria-hidden", "true");
      focusPanel.removeAttribute("data-daiion-selected-target");
      focusPanel.removeAttribute("role");
      focusPanel.removeAttribute("tabindex");
      focusPanel.removeAttribute("data-daiion-route-target");
      focusPanel.setAttribute("aria-label", "Archive Focus");
    }
  }

  if (!panel) {
    return;
  }

  if (daiionDestinationSelectedTarget) {
    panel.setAttribute("data-daiion-selected-target", daiionDestinationSelectedTarget);
  } else {
    panel.removeAttribute("data-daiion-selected-target");
  }
}

function setDaiionDestinationTarget(target) {
  if (!isDaiionArchiveLandingPath() || !daiionDestinationTargets.has(target)) {
    return;
  }

  daiionDestinationSelectedTarget = target;
  syncDaiionDestinationSelection();
}

function routeDaiionArchiveFocusPanel() {
  const focusPanel = document.querySelector("[data-daiion-archive-focus]");
  const routeTarget = focusPanel?.getAttribute("data-daiion-route-target");
  if (!routeTarget || !isDaiionArchiveLandingPath() || !focusPanel.classList.contains("is-active")) {
    return;
  }

  navigateToRoute(routeTarget);
}

function initDaiionDestinationPanel() {
  const destinationControls = Array.from(document.querySelectorAll("[data-daiion-destination-target]"));
  const focusPanel = document.querySelector("[data-daiion-archive-focus]");
  if (!destinationControls.length) {
    return;
  }

  destinationControls.forEach((control) => {
    if (control.getAttribute("data-daiion-destination-bound") === "true") {
      return;
    }

    control.setAttribute("data-daiion-destination-bound", "true");
    control.addEventListener("click", () => {
      setDaiionDestinationTarget(control.getAttribute("data-daiion-destination-target"));
    });
  });

  if (focusPanel && focusPanel.getAttribute("data-daiion-archive-focus-bound") !== "true") {
    focusPanel.setAttribute("data-daiion-archive-focus-bound", "true");
    focusPanel.addEventListener("click", routeDaiionArchiveFocusPanel);
    focusPanel.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      routeDaiionArchiveFocusPanel();
    });
  }

  syncDaiionDestinationSelection();
}

function getDaiionFiniteStat(source, paths = []) {
  if (!source || typeof source !== "object") {
    return null;
  }

  for (const path of paths) {
    const value = String(path).split(".").reduce((result, key) => (
      result && Object.prototype.hasOwnProperty.call(result, key) ? result[key] : undefined
    ), source);
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) {
      return numberValue;
    }
  }

  return null;
}

function getDaiionPromotionTotal(showsStats) {
  const explicitTotal = getDaiionFiniteStat(showsStats, [
    "totals.promotionsTotal",
    "totals.promotionCount",
    "promotionsTotal",
    "promotionCount",
  ]);

  if (Number.isFinite(explicitTotal)) {
    return explicitTotal;
  }

  return Array.isArray(showsStats?.byPromotion) ? showsStats.byPromotion.length : null;
}

function formatDaiionArchiveStat(value) {
  return Number.isFinite(value) ? Math.trunc(value).toLocaleString("en-US") : "N/A";
}

function getDaiionArchiveDecodeFrames(finalValue) {
  const rawDigits = String(finalValue).replace(/\D/g, "");
  const numberValue = Number(rawDigits || 0);
  const hexValue = Number.isFinite(numberValue)
    ? Math.max(1, Math.min(0xfff, numberValue)).toString(16).toUpperCase().padStart(Math.min(Math.max(rawDigits.length, 2), 3), "0")
    : "7F";

  return ["░░", "7F", hexValue];
}

function setDaiionArchiveValueLocked(node, value) {
  node.textContent = value;
  node.classList.remove("is-decoding");
  node.classList.add("is-locked", "is-locking");
  window.setTimeout(() => node.classList.remove("is-locking"), 320);
}

function decodeDaiionArchiveValue(node, finalValue, rowIndex) {
  const decodeFrames = getDaiionArchiveDecodeFrames(finalValue);
  const rowDelay = 160 + rowIndex * daiionArchiveStatsRowStagger;
  window.setTimeout(() => {
    node.classList.remove("is-locked", "is-locking");
    node.classList.add("is-decoding");
    decodeFrames.forEach((frame, frameIndex) => {
      window.setTimeout(() => {
        node.textContent = frame;
      }, frameIndex * 76);
    });
    window.setTimeout(() => setDaiionArchiveValueLocked(node, finalValue), decodeFrames.length * 76 + 58);
  }, rowDelay);
}

function resolveDaiionArchiveStatsValues(valueNodes, mappedStats, animationStartedAt = daiionArchiveStatsStartedAt) {
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const finalValues = valueNodes.map((node) => {
    const key = node.getAttribute("data-daiion-stat-value");
    const value = mappedStats[key];
    return Number.isFinite(value) ? formatDaiionArchiveStat(value) : "N/A";
  });

  if (reduceMotion) {
    valueNodes.forEach((node, index) => setDaiionArchiveValueLocked(node, finalValues[index]));
    return;
  }

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const startedAt = Number.isFinite(animationStartedAt) ? animationStartedAt : now;
  const remainingDelay = Math.max(0, daiionArchiveStatsDecodeDelay - (now - startedAt));
  window.setTimeout(() => {
    valueNodes.forEach((node, index) => decodeDaiionArchiveValue(node, finalValues[index], index));
  }, remainingDelay);
}

async function fetchDaiionArchiveStats(endpoint) {
  const response = await fetch(endpoint, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

async function initDaiionArchiveStatsPanel(options = {}) {
  if (!isDaiionArchiveLandingPath() || typeof fetch !== "function") {
    return;
  }

  const valueNodes = Array.from(document.querySelectorAll("[data-daiion-stat-value]"));
  if (!valueNodes.length) {
    return;
  }

  const requestId = ++daiionArchiveStatsRequestId;
  const animationStartedAt = Number.isFinite(options.animationStartedAt)
    ? options.animationStartedAt
    : (typeof performance !== "undefined" ? performance.now() : Date.now());

  try {
    const [showsResult, peopleResult, venuesResult] = await Promise.allSettled([
      fetchDaiionArchiveStats(daiionArchiveStatsEndpoints.shows),
      fetchDaiionArchiveStats(daiionArchiveStatsEndpoints.people),
      fetchDaiionArchiveStats(daiionArchiveStatsEndpoints.venues),
    ]);
    if (requestId !== daiionArchiveStatsRequestId || !isDaiionArchiveLandingPath()) {
      return;
    }

    const showsStats = showsResult.status === "fulfilled" ? showsResult.value : null;
    const peopleStats = peopleResult.status === "fulfilled" ? peopleResult.value : null;
    const venuesStats = venuesResult.status === "fulfilled" ? venuesResult.value : null;
    resolveDaiionArchiveStatsValues(valueNodes, {
      promotions: getDaiionPromotionTotal(showsStats),
      venues: getDaiionFiniteStat(venuesStats, ["total_venues", "totalVenues", "venuesTotal", "totals.venuesTotal"]),
      shows: getDaiionFiniteStat(showsStats, ["totals.showsTotal", "showsTotal", "totalShows"]),
      matches: getDaiionFiniteStat(showsStats, ["totals.matchesTotal", "matchesTotal", "totalMatches"]),
      people: getDaiionFiniteStat(peopleStats, ["totalPeople", "peopleTotal", "totals.peopleTotal"]),
    }, animationStartedAt);
  } catch (_error) {
    if (requestId !== daiionArchiveStatsRequestId || !isDaiionArchiveLandingPath()) {
      return;
    }
    resolveDaiionArchiveStatsValues(valueNodes, {}, animationStartedAt);
  }
}

initDaiionDestinationPanel();
