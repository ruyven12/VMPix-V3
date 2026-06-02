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
const shellBreadcrumb = document.querySelector("[data-shell-breadcrumb]");
const shellBreadcrumbList = document.querySelector("[data-shell-breadcrumb-list]");
const bottomRail = document.querySelector("[data-shell-bottom-rail]");
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
const galleryGrid = document.querySelector("[data-gallery-grid]");
const galleryPhotoTiles = document.querySelectorAll("[data-gallery-photo]");
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
const lightboxMetaDate = document.querySelector("[data-lightbox-meta-date]");
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
let activationTimer;
let spotlightFrame;
let drawerCloseTimer;
let activeBandsView = "radar";
let activeBandsLetter = "A";
let activeBandsFilterLetter = "";
let bandsSearchTerm = "";
let bandsIndexReturnUrl = "/music/bands";
let activeMusicPeoplePage = 1;
let activeMusicPeopleId = "";
let activeMusicPersonDetailId = "";
let activeWrestlingPersonId = "";
let activeWrestlingVenueId = "";
let activeMusicBand = null;
let activeSetRow = null;
let isSetDetailOpen = false;
let activeGalleryPhoto = null;
let isGalleryModeOpen = false;
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
let activeMusicShowsYear = "ALL SHOWS";
let visibleMusicShowsCount = 4;

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
  calendar: "/calendar",
  about: "/about",
  contact: "/contact",
};

const shellDrawerGroups = [
  { id: "shell", label: "Shell" },
  { id: "music", label: "Music Nexus" },
  { id: "wrestling", label: "Wrestling Nexus" },
  { id: "site", label: "Site" },
  { id: "future", label: "Future Modules" },
];

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
    label: "Music Nexus",
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
    id: "wrestling",
    route: routePaths.wrestling,
    label: "Wrestling Nexus",
    parentSection: "Portfolio",
    moduleType: "module",
    drawerGroup: "wrestling",
    breadcrumbLabel: "Wrestling",
    bottomRailEligible: true,
    drawerVariant: "module",
  },
  {
    id: "wrestling-shows",
    route: routePaths.wrestlingShows,
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
  music: "music",
  "music-bands": "music-bands",
  "band-detail": "music-bands",
  "set-detail": "music-bands",
  "music-people": "music-people",
  "person-detail": "music-people",
  "music-shows": "music-shows",
  "show-detail": "music-shows",
  "music-venues": "music",
  wrestling: "wrestling",
  "wrestling-shows": "wrestling-shows",
  "wrestling-show-detail": "wrestling-shows",
  "wrestling-match-gallery": "wrestling-shows",
  "wrestling-lightbox": "wrestling-shows",
  "wrestling-people": "wrestling-people",
  "wrestling-person-detail": "wrestling-people",
  "wrestling-venues": "wrestling",
  "wrestling-venue-detail": "wrestling",
  calendar: "calendar",
  about: "about",
  contact: "contact",
};

const routeNameToBreadcrumbTrail = {
  home: ["home"],
  portfolio: ["portfolio"],
  music: ["portfolio", "music"],
  "music-bands": ["portfolio", "music", "music-bands"],
  "band-detail": ["portfolio", "music", "music-bands"],
  "set-detail": ["portfolio", "music", "music-bands"],
  "music-people": ["portfolio", "music", "music-people"],
  "person-detail": ["portfolio", "music", "music-people"],
  "music-shows": ["portfolio", "music", "music-shows"],
  "show-detail": ["portfolio", "music", "music-shows"],
  "music-venues": ["portfolio", "music"],
  wrestling: ["portfolio", "wrestling"],
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
};

const routeNameToDrilldownBreadcrumb = {
  "band-detail": "Band Detail",
  "set-detail": "Set Detail",
  "person-detail": "Person Detail",
  "show-detail": "Show Detail",
  "wrestling-person-detail": "Person Detail",
  "wrestling-venue-detail": "Venue Detail",
  "wrestling-show-detail": "Show Detail",
  "wrestling-match-gallery": "Match Gallery",
  "wrestling-lightbox": "Photo",
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
