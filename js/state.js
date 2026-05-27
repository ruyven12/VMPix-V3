/* =========================================================
   VMPix V3 state.
   Shared DOM references, mock data, and lightweight shell state.
   Extracted from the original single-file shell; keep this pass mechanical.
   ========================================================= */

const shell = document.querySelector(".site-shell");
const startButton = document.querySelector(".start-button");
const homeFrame = document.querySelector(".home-frame");
const portfolioHub = document.querySelector(".portfolio-hub");
const aboutShell = document.querySelector("[data-about-shell]");
const calendarShell = document.querySelector("[data-calendar-shell]");
const contactShell = document.querySelector("[data-contact-shell]");
const bottomRail = document.querySelector("[data-shell-bottom-rail]");
const railMenuTrigger = document.querySelector("[data-rail-menu-trigger]");
const globalMenuDrawer = document.querySelector("[data-global-menu-drawer]");
const globalMenuBackdrop = document.querySelector("[data-global-menu-backdrop]");
const globalMenuClose = document.querySelector("[data-global-menu-close]");
const globalNavButtons = document.querySelectorAll("[data-global-nav-target]");
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
const musicNexusCards = document.querySelectorAll("[data-music-nexus-card]");
const ringArchiveShell = document.querySelector("[data-ring-archive-shell]");
const ringArchiveBack = document.querySelector("[data-ring-archive-back]");
const musicActivityPanel = document.querySelector("[data-music-activity-panel]");
const musicActivityList = document.querySelector("[data-music-activity-list]");
const musicBandsIndex = document.querySelector("[data-music-bands-index]");
const musicPeopleIndex = document.querySelector("[data-music-people-index]");
const musicPeopleList = document.querySelector("[data-music-people-list]");
const personDetail = document.querySelector("[data-person-detail]");
const musicNexusBack = document.querySelector("[data-music-nexus-back]");
const bandsViewButtons = document.querySelectorAll("[data-bands-view-target]");
const bandsViewPanels = document.querySelectorAll("[data-bands-view]");
const bandsLetterNavs = document.querySelectorAll("[data-bands-letter-nav], [data-bands-letter-nav-list], [data-bands-letter-nav-search]");
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
const bandDetail = document.querySelector("[data-band-detail-placeholder]");
const bandDetailBack = document.querySelector("[data-band-detail-back]");
const bandDetailPoster = document.querySelector(".band-detail-poster");
const bandDetailThumb = document.querySelector("[data-band-detail-thumb]");
const bandDetailLogoName = document.querySelector("[data-band-detail-logo-name]");
const bandDetailName = document.querySelector("[data-band-detail-name]");
const bandDetailRegion = document.querySelector("[data-band-detail-region]");
const bandDetailStatus = document.querySelector("[data-band-detail-status]");
const bandDetailSets = document.querySelector("[data-band-detail-sets]");
const bandDetailTotalSets = document.querySelector("[data-band-detail-total-sets]");
const bandDetailPhotos = document.querySelector("[data-band-detail-photos]");
const bandDetailViewSets = document.querySelector("[data-band-detail-view-sets]");
const setsArchive = document.querySelector("[data-sets-archive]");
const setsArchiveBack = document.querySelector("[data-sets-archive-back]");
const setsArchiveBand = document.querySelector("[data-sets-archive-band]");
const setsYearButtons = document.querySelectorAll("[data-sets-year]");
const setsListYearLabel = document.querySelector("[data-sets-list-year-label]");
const setsRows = document.querySelectorAll("[data-set-row]");
const setsFeaturedImage = document.querySelector("[data-sets-featured-image]");
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
const setGalleryThumb = document.querySelector("[data-set-gallery-thumb]");
const setGalleryDate = document.querySelector("[data-set-gallery-date]");
const setGalleryTitle = document.querySelector("[data-set-gallery-title]");
const setGalleryCity = document.querySelector("[data-set-gallery-city]");
const setGalleryVenue = document.querySelector("[data-set-gallery-venue]");
const setGalleryPhotos = document.querySelector("[data-set-gallery-photos]");
const setGalleryContributors = document.querySelector("[data-set-gallery-contributors]");
const setGalleryQuality = document.querySelector("[data-set-gallery-quality]");
const setGalleryCamera = document.querySelector("[data-set-gallery-camera]");
const setGalleryNotes = document.querySelector("[data-set-gallery-notes]");
const setGalleryPhotoCount = document.querySelector("[data-set-gallery-photo-count]");
const galleryPhotoTiles = document.querySelectorAll("[data-gallery-photo]");
const galleryViewAll = document.querySelector("[data-gallery-view-all]");
const galleryLightboxPrep = document.querySelector("[data-gallery-lightbox-prep]");
const galleryLightboxTitle = document.querySelector("[data-gallery-lightbox-title]");
const lightboxScreen = document.querySelector("[data-lightbox-screen]");
const lightboxBack = document.querySelector("[data-lightbox-back]");
const lightboxPhoto = document.querySelector("[data-lightbox-photo]");
const lightboxPhotoTitle = document.querySelector("[data-lightbox-photo-title]");
const lightboxCounter = document.querySelector("[data-lightbox-counter]");
const lightboxPrev = document.querySelector("[data-lightbox-prev]");
const lightboxNext = document.querySelector("[data-lightbox-next]");
const lightboxInfoToggle = document.querySelector("[data-lightbox-info-toggle]");
const lightboxInfoPanel = document.querySelector("[data-lightbox-info-panel]");
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
let activationTimer;
let spotlightFrame;
let drawerCloseTimer;
let activeBandsView = "radar";
let activeBandsLetter = "A";
let activeBandsFilterLetter = "";
let bandsSearchTerm = "";
let bandsIndexReturnUrl = "/music/bands?view=radar";
let activeMusicPeoplePage = 1;
let activeMusicPeopleId = "";
let activeMusicPersonDetailId = "";
let activeMusicBand = null;
let activeSetRow = null;
let isSetDetailOpen = false;
let activeGalleryPhoto = null;
let isGalleryModeOpen = false;
let activeLightboxIndex = 0;
let isLightboxThumbnailStripOpen = false;
let areLightboxControlsHidden = false;

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

const lightboxBasePhotoIndex = 25;
const lightboxTotalPhotos = 356;

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

const musicBandIndexRows = [
  { bandId: "13-high", name: "Astra Vale", region: "Local", status: "Complete Archive", statusKey: "complete", albums: 12, thumb: "AV" },
  { bandId: "3fd", name: "Black Harbor", region: "Regional", status: "Partial Archive", statusKey: "partial", albums: 8, thumb: "BH" },
  { bandId: "4x4-barracuda", name: "Crimson Static", region: "National", status: "Complete Archive", statusKey: "complete", albums: 34, thumb: "CS" },
  { bandId: "6-gig", name: "Dead Letters", region: "Local", status: "Partial Archive", statusKey: "partial", albums: 4, thumb: "DL" },
  { bandId: "a-river-of-trees", name: "Echo District", region: "International", status: "Complete Archive", statusKey: "complete", albums: 18, thumb: "ED" },
  { bandId: "glass-ritual", name: "Glass Ritual", region: "Regional", status: "Needs Work", statusKey: "needs", albums: 6, thumb: "GR" },
  { bandId: "hollow-signal", name: "Hollow Signal", region: "Local", status: "Complete Archive", statusKey: "complete", albums: 9, thumb: "HS" },
  { bandId: "moon-circuit", name: "Moon Circuit", region: "National", status: "Partial Archive", statusKey: "partial", albums: 11, thumb: "MC" },
  { bandId: "neon-saints", name: "Neon Saints", region: "International", status: "Complete Archive", statusKey: "complete", albums: 27, thumb: "NS" },
  { bandId: "ritual-bloom", name: "Ritual Bloom", region: "Regional", status: "Needs Work", statusKey: "needs", albums: 5, thumb: "RB" },
  { bandId: "silver-static", name: "Silver Static", region: "National", status: "Partial Archive", statusKey: "partial", albums: 16, thumb: "SS" },
  { bandId: "violet-machines", name: "Violet Machines", region: "International", status: "Complete Archive", statusKey: "complete", albums: 22, thumb: "VM" },
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
const musicPeoplePageSize = 5;

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
    copy: "Static loading placeholder reserved for future person archive requests.",
  },
  error: {
    title: "Unable To Load Person Archive",
    copy: "Static error placeholder reserved for future archive recovery.",
  },
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
  musicPeople: "/music/people",
  wrestling: "/wrestling",
  calendar: "/calendar",
  about: "/about",
  contact: "/contact",
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
