(function () {
  function imageFallback(img) {
    const wrapper = document.createElement("div");
    wrapper.className = "asset-placeholder";
    wrapper.innerHTML = '<div class="placeholder-mask" aria-hidden="true"></div>';
    img.replaceWith(wrapper);
  }

  function maskById(id) {
    return window.NuoData.maskData.find((mask) => mask.id === id) || window.NuoData.maskData[0];
  }

  function createMaskCard(mask, options = {}) {
    const card = document.createElement(options.button ? "button" : "article");
    card.className = "mask-card";
    if (options.button) card.type = "button";
    card.dataset.maskId = mask.id;
    card.innerHTML = `
      <div class="mask-card-image">
        <img src="${NuoRouter.asset(mask.image)}" alt="${mask.name}面具" onerror="NuoApp.imageFallback(this)" />
      </div>
      <div>
        <h3>${mask.name}</h3>
        <div class="meta-line"><span>${mask.region}</span><span>${mask.role}</span></div>
        <p>${mask.meaning}</p>
        <div class="meta-line">${mask.keywords.map((word) => `<span class="tag">${word}</span>`).join("")}</div>
      </div>
    `;
    return card;
  }

  const progressNavItems = [
    { label: "溯源", route: "origin", href: "pages/origin.html", left: 0, width: 51 },
    { label: "三感", route: "three-senses", href: "pages/three-senses.html", left: 52, width: 59 },
    { label: "形", route: "masks", href: "pages/masks.html", left: 111, width: 47 },
    { label: "诸神", route: "masks", href: "pages/masks.html", left: 158, width: 42 },
    { label: "择面", route: "choose-mask", href: "pages/choose-mask.html", left: 200, width: 47 },
    { label: "制面", route: "craft-mask", href: "pages/craft-mask.html", left: 247, width: 45 },
    { label: "戴面", route: "wear-mask", href: "pages/wear-mask.html", left: 292, width: 45 },
    { label: "动", route: "gestures", href: "pages/gestures.html", left: 337, width: 45 },
    { label: "掌间", route: "gestures", href: "pages/gestures.html", left: 382, width: 42 },
    { label: "法器", route: "instruments", href: "pages/instruments.html", left: 424, width: 45 },
    { label: "声", route: "music", href: "pages/music.html", left: 469, width: 45 },
    { label: "傩乐", route: "music", href: "pages/music.html", left: 514, width: 39 },
    { label: "尾", route: "summary", href: "pages/summary.html", left: 553, width: 35 },
  ];

  const progressByPage = {
    home: 0,
    origin: 43,
    "three-senses": 103,
    masks: 189,
    "choose-mask": 234,
    "craft-mask": 279,
    "wear-mask": 324,
    gestures: 412,
    instruments: 457,
    music: 543,
    summary: 588,
  };

  function initProgressNav() {
    const header = document.querySelector(".site-header");
    const nav = document.querySelector(".site-nav");
    if (!header || !nav || header.querySelector(".progress-nav")) return;

    header.querySelectorAll(".nav-toggle").forEach((toggle) => toggle.remove());
    nav.hidden = true;
    nav.setAttribute("aria-hidden", "true");

    const current = document.body.dataset.page || "home";
    const progress = Math.max(0, Math.min(100, ((progressByPage[current] || 0) / 588) * 100));
    const src = NuoRouter.asset("assets/ui/progress-nav.png");
    const progressNav = document.createElement("div");
    progressNav.className = "progress-nav";
    progressNav.setAttribute("aria-label", "流程进度导航");
    progressNav.setAttribute("role", "navigation");
    progressNav.style.setProperty("--progress-nav-fill", `${progress}%`);

    progressNav.innerHTML = `
      <img class="progress-nav-image progress-nav-image--muted" src="${src}" alt="" aria-hidden="true" />
      <span class="progress-nav-lit" aria-hidden="true">
        <img class="progress-nav-image" src="${src}" alt="" />
      </span>
      ${progressNavItems
        .map(
          (item) => `
            <a
              class="progress-nav-hit"
              href="${NuoRouter.path(item.href)}"
              data-route="${item.route}"
              aria-label="跳转到${item.label}"
              style="--hit-left:${(item.left / 588) * 100}%; --hit-width:${(item.width / 588) * 100}%;"
            ></a>
          `
        )
        .join("")}
    `;

    header.insertBefore(progressNav, nav);
  }

  function init() {
    NuoRouter.initNav();
    initProgressNav();
    const isIntroHome = document.body.dataset.page === "home" && document.body.classList.contains("is-intro-active");
    NuoAudio.initBackground({ autoResume: !isIntroHome });
    NuoParticles.init();
  }

  window.NuoApp = { init, imageFallback, maskById, createMaskCard };
  document.addEventListener("DOMContentLoaded", init);
})();
