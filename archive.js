const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const makeElement = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const header = document.querySelector(".archive-header, .site-header");
const progress = document.querySelector(".archive-progress, .scroll-progress");
const menuButton = document.querySelector("#archive-menu-toggle");
const navigation = document.querySelector("#archive-navigation");
const homeMenuButton = document.querySelector(".nav-toggle");
const homeNavigation = document.querySelector(".nav-links");
const mobileNavigation = window.matchMedia("(max-width: 720px)");

const setNavigation = (open, returnFocus = false) => {
  if (!menuButton || !navigation) return;
  document.body.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  menuButton.querySelector("span").textContent = open ? "CLOSE" : "MENU";
  navigation.setAttribute("aria-hidden", String(!open));

  if (open) {
    window.setTimeout(() => navigation.querySelector("a")?.focus(), reducedMotion ? 0 : 240);
  } else if (returnFocus) {
    menuButton.focus();
  }
};

menuButton?.addEventListener("click", () => {
  setNavigation(menuButton.getAttribute("aria-expanded") !== "true", true);
});

navigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setNavigation(false));
});

const setHomeNavigation = (open, returnFocus = false) => {
  if (!homeMenuButton || !homeNavigation) return;
  const menuIsOpen = open && mobileNavigation.matches;
  document.body.classList.toggle("menu-open", menuIsOpen);
  homeMenuButton.setAttribute("aria-expanded", String(menuIsOpen));
  homeMenuButton.setAttribute("aria-label", menuIsOpen ? "Close menu" : "Open menu");
  homeNavigation.inert = mobileNavigation.matches && !menuIsOpen;

  if (mobileNavigation.matches) {
    homeNavigation.setAttribute("aria-hidden", String(!menuIsOpen));
  } else {
    homeNavigation.removeAttribute("aria-hidden");
  }

  if (menuIsOpen) {
    window.requestAnimationFrame(() => homeNavigation.querySelector("a")?.focus());
  } else if (returnFocus) {
    homeMenuButton.focus();
  }
};

homeMenuButton?.addEventListener("click", () => {
  setHomeNavigation(!document.body.classList.contains("menu-open"), true);
});

homeNavigation?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setHomeNavigation(false));
});

mobileNavigation.addEventListener("change", () => setHomeNavigation(false));
setHomeNavigation(false);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
    if (menuButton) setNavigation(false, true);
    else setHomeNavigation(false, true);
  }
});

const updateScrollState = () => {
  const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const amount = Math.min(1, window.scrollY / scrollable);
  header?.classList.toggle("scrolled", window.scrollY > 18);
  if (progress) progress.style.width = `${amount * 100}%`;
};

updateScrollState();
window.addEventListener("scroll", updateScrollState, { passive: true });

const revealObserver =
  "IntersectionObserver" in window && !reducedMotion
    ? new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        { rootMargin: "100px 0px", threshold: 0.08 }
      )
    : null;

const reveal = (nodes) => {
  nodes.forEach((node) => {
    if (revealObserver) revealObserver.observe(node);
    else node.classList.add("is-visible");
  });
};

const projectsGrid = document.querySelector("#projects-grid");
const projectJumpList = document.querySelector("#project-jump-list");

const buildProjectCard = (project, position) => {
  const article = makeElement("article", "project-entry");
  const media = makeElement("div", "project-entry-media");
  const image = document.createElement("img");
  const count = makeElement(
    "span",
    "project-entry-count",
    `${String(position + 1).padStart(2, "0")} / 12`
  );
  const state = makeElement("span", "project-entry-state", project.status);
  const controls = makeElement("div", "project-view-controls");
  const mediaToolbar = makeElement("div", "project-media-toolbar");
  const activeView = makeElement("span", "project-active-view");
  const expandButton = makeElement("button", "project-expand", "FULL VIEW ↗");
  const copy = makeElement("div", "project-entry-copy");
  const kicker = makeElement("p", "project-entry-kicker", project.kicker);
  const title = makeElement("h3", "", project.title);
  const description = makeElement("p", "project-entry-description", project.description);
  const scope = makeElement("ul", "project-entry-scope");
  const metrics = makeElement("dl", "project-entry-metrics");
  const initialView = project.views.find((view) => view.key === "perspective") || project.views[0];

  article.id = `project-${project.id}`;
  article.dataset.projectCard = project.id;
  title.id = `project-title-${project.id}`;
  article.setAttribute("aria-labelledby", title.id);
  image.src = initialView.image;
  image.alt = initialView.alt;
  image.loading = position < 2 ? "eager" : "lazy";
  image.decoding = "async";
  image.fetchPriority = position < 2 ? "high" : "auto";
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", `Select a view of ${project.title}`);
  activeView.setAttribute("aria-live", "polite");
  expandButton.type = "button";

  const updateViewDetails = (view) => {
    const viewIndex = project.views.findIndex((item) => item.key === view.key);
    activeView.textContent = `VIEW ${String(viewIndex + 1).padStart(2, "0")} / ${String(project.views.length).padStart(2, "0")} · ${view.label.toUpperCase()}`;
    expandButton.dataset.lightbox = view.image;
    expandButton.dataset.alt = view.alt;
    expandButton.dataset.caption = `${project.title} — ${view.label} view`;
    expandButton.setAttribute("aria-label", `Open full-size ${view.label.toLowerCase()} view of ${project.title}`);
    article.dataset.activeView = view.key;
  };

  const setView = (view) => {
    updateViewDetails(view);
    controls.querySelectorAll("button").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.view === view.key));
    });
    if (image.src === view.image) return;
    image.classList.add("is-switching");
    const nextImage = new Image();
    nextImage.onload = () => {
      image.src = view.image;
      image.alt = view.alt;
      window.requestAnimationFrame(() => image.classList.remove("is-switching"));
      const nextViewIndex = (project.views.findIndex((item) => item.key === view.key) + 1) % project.views.length;
      const preload = new Image();
      preload.src = project.views[nextViewIndex].image;
    };
    nextImage.onerror = () => image.classList.remove("is-switching");
    nextImage.src = view.image;
  };

  project.views.forEach((view) => {
    const button = makeElement("button", "", view.label);
    button.type = "button";
    button.dataset.view = view.key;
    button.title = view.label;
    button.setAttribute("aria-pressed", String(view.key === initialView.key));
    button.setAttribute("aria-label", `Show ${view.label.toLowerCase()} view of ${project.title}`);
    button.addEventListener("click", () => setView(view));
    controls.append(button);
  });

  controls.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const buttons = [...controls.querySelectorAll("button")];
    const currentIndex = buttons.indexOf(document.activeElement);
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (Math.max(0, currentIndex) + direction + buttons.length) % buttons.length;
    buttons[nextIndex].click();
    buttons[nextIndex].focus();
  });

  updateViewDetails(initialView);
  mediaToolbar.append(activeView, expandButton);

  project.scope.forEach((item) => scope.append(makeElement("li", "", item)));
  project.metrics.forEach((metric) => {
    const wrapper = document.createElement("div");
    wrapper.append(makeElement("dt", "", metric.label), makeElement("dd", "", metric.value));
    metrics.append(wrapper);
  });

  media.append(image, count, state, mediaToolbar, controls);
  copy.append(kicker, title, description, scope, metrics);
  article.append(media, copy);
  return article;
};

const loadProjects = async () => {
  if (!projectsGrid) return;

  try {
    const indexResponse = await fetch("assets/projects/index.json");
    if (!indexResponse.ok) throw new Error(`Project index request failed: ${indexResponse.status}`);
    const metadataPaths = await indexResponse.json();
    const projects = await Promise.all(
      metadataPaths.map(async (metadataPath) => {
        const metadataUrl = new URL(`assets/projects/${metadataPath}`, window.location.href);
        const response = await fetch(metadataUrl);
        if (!response.ok) throw new Error(`Project request failed: ${response.status}`);
        const project = await response.json();
        project.views = project.views.map((view) => ({
          ...view,
          image: new URL(view.image, metadataUrl).href,
        }));
        return project;
      })
    );

    const cards = projects.map(buildProjectCard);
    projectsGrid.replaceChildren(...cards);
    reveal(cards);

    if (projectJumpList) {
      const links = projects.map((project, index) => {
        const link = makeElement("a", "");
        link.href = `#project-${project.id}`;
        link.append(
          makeElement("span", "", String(index + 1).padStart(2, "0")),
          document.createTextNode(project.navTitle)
        );
        link.addEventListener("click", () => setNavigation(false));
        return link;
      });
      projectJumpList.replaceChildren(...links);
    }
  } catch (error) {
    const message = makeElement(
      "p",
      "archive-loading is-error",
      "The project archive could not be loaded. Open this site through its local web server and try again."
    );
    message.prepend(makeElement("span"));
    projectsGrid.replaceChildren(message);
    console.error(error);
  }
};

loadProjects();

const fieldNotes = [
  {
    index: "01",
    title: "Personal-mobility VTOL demonstrator",
    kicker: "PERSONAL MOBILITY / OUTDOOR FLIGHT",
    duration: "01:17",
    video: "assets/showcase/flight-proof/personal-mobility-vtol.mp4",
    poster: "assets/showcase/flight-proof/personal-mobility-vtol-poster.jpg",
    description: "A full-scale distributed-lift vehicle in sustained outdoor hover and translation, bringing the cabin, rotor frame, landing structure, and flight-control system together.",
  },
  {
    index: "02",
    title: "Aerial mission-feed demonstration",
    kicker: "MISSION SYSTEM / LIVE AERIAL FEED",
    duration: "01:40",
    video: "assets/showcase/flight-proof/aerial-mission-feed.mp4",
    poster: "assets/showcase/flight-proof/aerial-mission-feed-poster.jpg",
    description: "Recorded aircraft-view telemetry over mountainous terrain shows live visual awareness, route coverage, and the operational perspective delivered by the airborne platform.",
  },
  {
    index: "03",
    title: "Fixed-wing flight validation",
    kicker: "FIXED WING / AIRBORNE HANDLING",
    duration: "00:06",
    video: "assets/showcase/flight-proof/fixed-wing-flight.mp4",
    poster: "assets/showcase/flight-proof/fixed-wing-flight-poster.jpg",
    description: "A compact fixed-wing aircraft makes a banked field pass, providing direct visual evidence of airborne stability, control response, and outdoor operation.",
  },
  {
    index: "04",
    title: "Fixed-wing field flight sequence",
    kicker: "FIELD OPERATIONS / FIXED-WING SORTIE",
    duration: "00:14",
    video: "assets/showcase/flight-proof/field-launch-validation.mp4",
    poster: "assets/showcase/flight-proof/field-launch-validation-poster.jpg",
    description: "Runway-side footage follows a fixed-wing sortie in a real operating environment, connecting ground preparation and launch conditions with the airborne phase.",
  },
  {
    index: "05",
    title: "Mobile UAV catapult hardware",
    kicker: "GROUND SYSTEM / ASSISTED LAUNCH",
    duration: "00:16",
    video: "assets/showcase/flight-proof/mobile-catapult.mp4",
    poster: "assets/showcase/flight-proof/mobile-catapult-poster.jpg",
    description: "A trailer-mounted truss launcher in the field documents the adjustable rail, mobile chassis, support structure, and aircraft interface used for assisted launch.",
  },
  {
    index: "06",
    title: "Propulsion integration rig",
    kicker: "PROPULSION R&D / BENCH INTEGRATION",
    duration: "00:30",
    video: "assets/showcase/flight-proof/propulsion-rig.mp4",
    poster: "assets/showcase/flight-proof/propulsion-rig-poster.jpg",
    description: "Workshop footage exposes propulsion hardware, wiring, support structure, and adjacent airframe geometry during hands-on integration and bench evaluation.",
    portrait: true,
  },
  {
    index: "07",
    title: "Solar-panel cleaning robot",
    kicker: "FIELD ROBOTICS / PV MAINTENANCE",
    duration: "01:23",
    video: "assets/showcase/flight-proof/solar-panel-cleaning.mp4",
    poster: "assets/showcase/flight-proof/solar-panel-cleaning-poster.jpg",
    description: "The tracked platform traverses photovoltaic modules while its brush removes debris, showing mobility, edge transition, and cleaning action in an outdoor array.",
  },
  {
    index: "08",
    title: "Multirotor flight test",
    kicker: "MULTIROTOR / LOW-ALTITUDE CONTROL",
    duration: "00:45",
    video: "assets/showcase/flight-proof/multirotor-flight.mp4",
    poster: "assets/showcase/flight-proof/multirotor-flight-poster.jpg",
    description: "A multirotor prototype is exercised close to the field, recording take-off, hover, translation, and attitude response during low-altitude testing.",
    portrait: true,
  },
  {
    index: "09",
    title: "Lighting and mechanism integration",
    kicker: "MECHATRONICS / FUNCTIONAL CHECK",
    duration: "00:12",
    video: "assets/showcase/flight-proof/mechanism-lighting-test.mp4",
    poster: "assets/showcase/flight-proof/mechanism-lighting-test-poster.jpg",
    description: "A compact enclosed prototype demonstrates integrated lighting, actuation, and mechanical movement during a close-range functional check.",
    portrait: true,
  },
  {
    index: "10",
    title: "CAD-to-hardware controller prototype",
    kicker: "PRODUCT DEVELOPMENT / PHYSICAL PROTOTYPE",
    duration: "00:08",
    video: "assets/showcase/flight-proof/cad-controller-prototype.mp4",
    poster: "assets/showcase/flight-proof/cad-controller-prototype-poster.jpg",
    description: "The controller is shown beside its CAD model, making the transition from digital packaging and interface design to working hardware visible.",
    portrait: true,
  },
  {
    index: "11",
    title: "Portable mechatronic prototype",
    kicker: "SYSTEM INTEGRATION / PORTABLE RIG",
    duration: "00:10",
    video: "assets/showcase/flight-proof/portable-mechatronic-rig.mp4",
    poster: "assets/showcase/flight-proof/portable-mechatronic-rig-poster.jpg",
    description: "A compact rig brings structure, motors, wiring, sensors, and radio control into one accessible assembly for field handling and subsystem checks.",
    portrait: true,
  },
];

const lazyVideos = [];

const buildFieldNote = (record, feedIndex) => {
  const article = makeElement(
    "article",
    `mixed-card mixed-card-video blog-card${record.portrait ? " is-portrait" : ""}`
  );
  const media = makeElement("div", "blog-card-media");
  const video = document.createElement("video");
  const source = document.createElement("source");
  const signal = makeElement("span", "blog-card-signal");
  const count = makeElement(
    "span",
    "blog-card-count",
    `${String(feedIndex + 1).padStart(2, "0")} / 34`
  );
  const copy = makeElement("div", "blog-card-copy");
  const title = makeElement("h3", "", record.title);
  const description = makeElement("p", "blog-card-description", record.description);
  const actions = makeElement("div", "video-card-actions");
  const playbackButton = makeElement("button", "video-action", "PAUSE");
  const soundButton = makeElement("button", "video-action", "SOUND OFF");

  signal.append(makeElement("i"), document.createTextNode("FLIGHT VIDEO"));
  article.dataset.mediaType = "video";
  video.controls = false;
  video.autoplay = !reducedMotion;
  video.defaultMuted = true;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "none";
  video.poster = record.poster;
  video.dataset.src = record.video;
  video.setAttribute("aria-label", `${record.title}, field-test video`);
  source.type = "video/mp4";
  video.append(source);
  lazyVideos.push(video);

  playbackButton.type = "button";
  playbackButton.setAttribute("aria-label", `Pause ${record.title}`);
  soundButton.type = "button";
  soundButton.setAttribute("aria-label", `Turn sound on for ${record.title}`);

  const updatePlaybackButton = () => {
    const isPaused = video.paused;
    playbackButton.textContent = isPaused ? "PLAY" : "PAUSE";
    playbackButton.setAttribute("aria-label", `${isPaused ? "Play" : "Pause"} ${record.title}`);
  };

  playbackButton.addEventListener("click", () => {
    video.dataset.manuallyPaused = String(!video.paused);
    if (video.paused) {
      loadVideo(video);
      video.play().catch(() => updatePlaybackButton());
    } else {
      video.pause();
    }
  });

  soundButton.addEventListener("click", () => {
    video.muted = !video.muted;
    soundButton.textContent = video.muted ? "SOUND OFF" : "SOUND ON";
    soundButton.classList.toggle("is-active", !video.muted);
    soundButton.setAttribute(
      "aria-label",
      `${video.muted ? "Turn sound on" : "Mute"} for ${record.title}`
    );
  });

  video.addEventListener("play", updatePlaybackButton);
  video.addEventListener("pause", updatePlaybackButton);
  actions.append(playbackButton, soundButton);

  media.append(video, signal, count, actions);
  copy.append(makeElement("p", "blog-card-kicker", record.kicker), title, description);
  const meta = makeElement("div", "blog-card-meta");
  meta.append(makeElement("span", "", `VIDEO / ${record.index}`), makeElement("span", "", record.duration));
  copy.append(meta);
  article.append(media, copy);
  return article;
};

const loadVideo = (video) => {
  if (video.dataset.loaded === "true") return;
  const source = video.querySelector("source");
  source.src = video.dataset.src;
  video.dataset.loaded = "true";
  video.load();
  if (!reducedMotion && video.dataset.inView === "true") {
    video.play().catch(() => {});
  }
};

const buildRecords = [
  ["01", "assets/Build%20Archives/e1701e56-2e69-4fa4-8e4f-3e4302f82012.JPG", "AIRFRAME / FULL SCALE", "Flying-wing structural prototype", "Completed outer geometry documents the transition from internal structure to a full-scale airframe."],
  ["02", "assets/Build%20Archives/29249d62-d0d8-4b8a-bd55-585b8bfc6ef3.JPG", "WING / INTERNAL STRUCTURE", "Rib-and-spar assembly", "A long-span wing skeleton is aligned on the bench before skinning and final integration."],
  ["03", "assets/Build%20Archives/5f8ab3b6-9620-4b98-9527-8b3dc015fd03.JPG", "LAUNCH SYSTEM / INTEGRATION", "Airframe-to-catapult interface", "Field hardware records rail alignment, launch carriage geometry, and aircraft mounting."],
  ["04", "assets/Build%20Archives/244ce9ce-0344-4c67-9312-a0eae4ad6086.JPG", "COMPOSITES / AIRFRAME", "Carbon flying-wing prototypes", "Two physical configurations expose surface finish, inlet packaging, and tail architecture."],
  ["05", "assets/Build%20Archives/764a2c10-d262-4daa-855f-766ee01390be.JPG", "COMPOSITES / PROCESS", "Vacuum-bagged airframe layup", "Sealed composite parts capture a real curing-stage record before trimming and assembly."],
  ["06", "assets/Build%20Archives/7d6d84f8-4241-45bd-afbb-2a90cd0e1176.JPG", "AIRFRAME / FIT-UP", "Internal flying-wing architecture", "Frames, ribs, and central fuselage sections are clamped for dimensional alignment."],
  ["07", "assets/Build%20Archives/283c695d-d8da-4108-9336-b7f4b45408dc.JPG", "FIELD SYSTEM / LAUNCH READY", "Mobile launch configuration", "The complete aircraft and launcher are documented together on the airfield."],
  ["08", "assets/Build%20Archives/d9d42acd-e49a-4762-b45a-3c55d7447edc.JPG", "PROTOTYPE / SUBSYSTEMS", "Integrated experimental airframe", "An open build exposes battery, wiring, propulsion, and structural packaging decisions."],
  ["09", "assets/Build%20Archives/f09e0686-3613-4090-a5b7-1eaed4dedaa4.JPG", "COMPOSITES / ASSEMBLY", "Carbon airframe fit-up", "Primary body and control surfaces meet during an intermediate workshop assembly."],
  ["10", "assets/Build%20Archives/155d2ff8-a953-447c-a956-e03c65589031.JPG", "TOOLING / FABRICATION", "Machined flying-wing pattern", "A full planform tool translates surface geometry into a repeatable physical process."],
  ["11", "assets/Build%20Archives/03457440-23f6-4c13-88ed-c97d7488ea0a.JPG", "ROBOTICS / BENCH BUILD", "Tracked maintenance platform", "Chassis, tracks, service rail, and fluid routing are evaluated as one system."],
  ["12", "assets/Build%20Archives/d0c3bed1-b46f-4b0f-b65c-d7b445687b0a.JPG", "ROBOTICS / DRIVETRAIN", "Track and frame integration", "A closer record of the mobile chassis, motor interfaces, and routed services."],
  ["13", "assets/Build%20Archives/IMG_0059-clean.jpg", "FIELD ROBOTICS / PV MAINTENANCE", "Solar-panel cleaning platform", "The operational reference records tracked mobility and full-width brush coverage."],
  ["14", "assets/Build%20Archives/3b9acf0c-9574-413c-9809-5e1876aef8a1.JPG", "GROUND SYSTEM / DEMONSTRATOR", "Autonomous mobile prototype", "A wheeled test platform integrates enclosure, sensors, suspension, and mobility hardware."],
  ["15", "assets/Build%20Archives/ecb7cce8-bb5b-45a0-b5e7-f8d108299497.JPG", "MECHATRONICS / CONTROLLER", "CAD-to-hardware mechanism", "The physical control assembly is checked directly against its digital packaging model."],
  ["16", "assets/Build%20Archives/fb298782-4d9a-48b6-9d4d-1b2b821ca76d.JPG", "MANUFACTURING / ENCLOSURE", "Machined controller panels", "Interface openings and mounting geometry are cut into the final aluminium panel set."],
  ["17", "assets/Build%20Archives/a49654ff-79c2-4caf-9a5f-109a8bb71db3.JPG", "MANUFACTURING / STRUCTURE", "CNC-cut structural profiles", "Lightened metal parts document the fabrication step before deburring and assembly."],
  ["18", "assets/Build%20Archives/4dd08193-f87c-4c9d-a5b3-458c695b6f7f-clean.jpg", "CONTROLS / SIMULATION", "Integrated simulation station", "A physical cockpit and control console support operator and systems evaluation."],
  ["19", "assets/Build%20Archives/aa19215b-820a-4716-82b7-034a65b01492.JPG", "ANALYSIS / AERODYNAMICS", "Velocity-streamline study", "Simulation records external flow behavior before physical configuration decisions are frozen."],
  ["20", "assets/Build%20Archives/c6e9dcfa-8152-4c1f-ab5c-b2f1590faa9b.JPG", "WORKSHOP / FINISHING", "Controlled composite finishing", "A protected workspace records the coating and surface-preparation phase."],
  ["21", "assets/Build%20Archives/6ff68342-c729-46e7-850e-6255271d2e15.JPG", "PROGRAMME / DEMONSTRATION", "Defence symposium review", "Integrated UAV hardware is presented for close technical review and discussion."],
  ["22", "assets/Build%20Archives/8902f403-2728-4b8f-a0e3-9e6018add443.JPG", "SPACE SECTOR / CONFERENCE", "International Conference on Space", "An industry milestone connecting hands-on development with the wider space ecosystem."],
  ["23", "assets/Build%20Archives/ba2d6347-fedb-48e9-b679-d12ed49216a9.JPG", "JOURNEY / AEROSPACE", "Research field milestone", "A personal archive frame marking the wider path behind the engineering work."],
];

const buildWorkshopNote = ([index, imagePath, kicker, title, description], feedIndex) => {
  const article = makeElement("article", "mixed-card mixed-card-photo build-story");
  const media = makeElement("button", "build-story-media");
  const image = document.createElement("img");
  const copy = makeElement("div", "build-story-copy");

  article.dataset.mediaType = "photo";
  media.type = "button";
  media.dataset.lightbox = imagePath;
  media.dataset.caption = `${title} — ${description}`;
  media.setAttribute("aria-label", `Open full-size image: ${title}`);
  image.src = imagePath;
  image.alt = title;
  image.loading = "lazy";
  image.decoding = "async";
  media.append(
    image,
    makeElement(
      "span",
      "build-story-index",
      `${String(feedIndex + 1).padStart(2, "0")} / 34`
    ),
    makeElement("span", "build-story-open", "OPEN ↗")
  );
  copy.append(makeElement("p", "build-story-kicker", `PHOTO / ${index} · ${kicker}`));
  copy.append(makeElement("h3", "", title));
  copy.append(makeElement("p", "build-story-description", description));
  article.append(media, copy);
  return article;
};

const interleaveRecords = (videos, photos) => {
  const mixed = [];
  let videoIndex = 0;
  let photoIndex = 0;

  while (videoIndex < videos.length || photoIndex < photos.length) {
    if (videoIndex < videos.length) mixed.push({ type: "video", record: videos[videoIndex++] });
    for (let count = 0; count < 2 && photoIndex < photos.length; count += 1) {
      mixed.push({ type: "photo", record: photos[photoIndex++] });
    }
  }

  return mixed;
};

const mixedMasonry = document.querySelector("#mixed-masonry");

if (mixedMasonry) {
  const cards = interleaveRecords(fieldNotes, buildRecords).map((item, index) =>
    item.type === "video"
      ? buildFieldNote(item.record, index)
      : buildWorkshopNote(item.record, index)
  );
  mixedMasonry.replaceChildren(...cards);
  reveal(cards);

  if ("IntersectionObserver" in window) {
    const loadObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadVideo(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "600px 0px", threshold: 0.01 }
    );
    lazyVideos.forEach((video) => loadObserver.observe(video));

    const playbackObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          video.dataset.inView = String(entry.isIntersecting);
          if (entry.isIntersecting && !reducedMotion && video.dataset.manuallyPaused !== "true") {
            loadVideo(video);
            video.play().catch(() => {});
          } else if (!entry.isIntersecting) {
            video.pause();
          }
        });
      },
      { threshold: 0.35 }
    );
    lazyVideos.forEach((video) => playbackObserver.observe(video));
  } else {
    lazyVideos.forEach(loadVideo);
  }

  const filterButtons = document.querySelectorAll("[data-media-filter]");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const activeFilter = button.dataset.mediaFilter;
      filterButtons.forEach((item) => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      cards.forEach((card) => {
        const isVisible = activeFilter === "all" || card.dataset.mediaType === activeFilter;
        card.hidden = !isVisible;
        const video = card.querySelector("video");
        if (!isVisible && video) video.pause();
      });
      mixedMasonry.dataset.activeFilter = activeFilter;
    });
  });
}

const lightbox = document.querySelector("#archive-lightbox");

document.addEventListener("click", (event) => {
  const trigger = event.target instanceof Element ? event.target.closest("[data-lightbox]") : null;
  if (!trigger || !lightbox) return;
  const image = lightbox.querySelector("img");
  image.src = trigger.dataset.lightbox;
  image.alt = trigger.dataset.alt || trigger.querySelector("img")?.alt || "Archive image";
  lightbox.querySelector("p").textContent = trigger.dataset.caption || image.alt;
  lightbox.showModal();
});

lightbox?.querySelector("button").addEventListener("click", () => lightbox.close());
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) lightbox.close();
});
