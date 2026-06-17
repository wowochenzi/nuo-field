const stage = document.getElementById("maskStage");
const track = document.getElementById("maskGrid");
const viewport = document.getElementById("maskCarouselViewport");
const cloudField = document.getElementById("maskClouds");
const detail = document.getElementById("maskDetail");
const prevButton = document.getElementById("maskPrev");
const nextButton = document.getElementById("maskNext");
const enterButton = document.getElementById("enterChooseMask");
const orbitCanvas = document.getElementById("maskOrbitCanvas");

const baseMasks = window.NuoData?.maskData || [];
const byId = new Map(baseMasks.map((mask) => [mask.id, mask]));

const copy = {
  "guizhou-kaishan-mangjiang": {
    sourceId: "kaishan-mangjiang",
    regionLine: "贵州傩堂戏",
    category: "镇邪武神 / 开路神将",
    role: "傩仪中常作为开场引路、驱邪开道的神将形象。",
    function: "承担震慑邪祟、打开仪式空间、引导观众进入傩场的作用。",
    origin: "形象多与地方傩仪中的开山、开路、护坛观念相关。",
    visual: "红黑对比强烈，怒目圆睁，獠牙外露，额部与头饰强化威严感。",
    meaning: "开山莽将属于威猛神将形象，寓意驱邪逐疫、开山辟路、镇压凶祟。其怒目、獠牙、红角与武器造型，强调的是以强悍神力震慑邪魔。",
    quote: "手执钺斧，砍杀邪魔。"
  },
  "guizhou-xianfeng-xiaojie": {
    sourceId: "xianfeng-xiaojie",
    regionLine: "贵州傩堂戏",
    category: "引导角色 / 人物角色",
    role: "在傩仪或表演结构中具有引导、过渡与角色串联功能。",
    function: "连接仪式段落与人物出场，使观众从观看转向进入情境。",
    origin: "与地方傩戏中人物化、戏剧化的角色系统相关。",
    visual: "面容柔和端正，冠饰精致，与武神类面具形成强烈反差。",
    meaning: "在傩堂戏中司催愿、勾愿之职，是《武先锋》的主角。她的寓意更强调“巾帼武先锋”的勇武、传令与护愿功能，象征愿望传达、和女性武将的英气。",
    quote: "巾帼武先锋，催愿勾愿。"
  },
  "guizhou-huoshen-lingguan": {
    sourceId: "huoshen-lingguan",
    regionLine: "贵州傩堂戏",
    category: "火神 / 护法神将",
    role: "象征火神威仪与护法力量，具有镇护和震慑意味。",
    function: "用于表现仪式中的净化、守护、镇邪与神力显现。",
    origin: "与民间火神信仰、护法神将系统和地方傩仪观念相关。",
    visual: "红色主面，怒目、獠牙、火焰感头饰，整体具有强烈冲击力。",
    meaning: "属于护法神将类形象，寓意烈火净秽、镇坛护法、惩恶驱邪。火神灵官的红面、獠牙、靠旗和武神装束，突出的是威严、刚烈与护法之力。",
    quote: "烈火显威，护法镇坛。"
  },
  "hubei-chenghuang-tudi": {
    sourceId: "chenghuang-tudi",
    regionLine: "湖北恩施傩戏",
    category: "地方守护神",
    role: "与地方信仰、土地守护、村社秩序和民俗祭祀相关。",
    function: "象征对一方土地、村落和日常生活的守护。",
    origin: "源于城隍、土地等民间守护神系统，与地方傩仪结合。",
    visual: "面容带有笑意，形象亲和，区别于强烈威慑型神将。",
    meaning: "属于地方守护神系统，寓意护佑乡土、安定村社、监察善恶、庇护百姓。它象征一方水土的守护与民间信仰中的安宁秩序。",
    quote: "庇佑乡土，守护村社。"
  },
  "jiangxi-leigong": {
    sourceId: "leigong",
    regionLine: "江西南丰傩戏",
    category: "雷神 / 镇邪神灵",
    role: "雷神形象，常与驱邪、震慑、惩恶和神威显现相关。",
    function: "通过雷电意象表现傩仪中的威慑力与神圣秩序。",
    origin: "与南丰傩面具系统中的雷神崇拜和地方镇邪观念相关。",
    visual: "绿色面部醒目，线条夸张，眼部突出，形成非人化神灵感。",
    meaning: "雷神形象，寓意雷霆天威、震慑邪祟、惩恶除秽。其夸张的眼部、尖锐面部结构和非人化造型，象征上天威力和对不祥之物的震慑。",
    quote: "雷霆震邪，天威赫赫。"
  },
  "jiangxi-yinjiao": {
    sourceId: "yinjiao",
    regionLine: "江西南丰傩戏",
    category: "护法神将 / 庄严威神",
    role: "具有神将身份和护法意味，是傩仪中威严、镇护类角色。",
    function: "承担守护仪式秩序、彰显神将力量的作用。",
    origin: "与南丰傩戏神将角色谱系和民间信仰叙事相关。",
    visual: "黄色面部配合红色头饰，眉眼夸张，表情威严而紧张。",
    meaning: "是傩神系统中的威猛神将。其寓意集中在镇邪、杀伐、压制凶煞与护持秩序，资料中称其为“执掌太岁凶煞、司职杀伐镇邪”的神将。",
    quote: "执掌凶煞，司职镇邪。"
  },
  "hebei-datou-heshang": {
    sourceId: "datou-heshang",
    regionLine: "河北武安傩戏",
    category: "民间人物 / 戏剧角色",
    role: "具有民间戏剧色彩与人物辨识度，常以夸张造型形成喜剧效果。",
    function: "在傩戏或民俗表演中调节气氛，增强观看趣味。",
    origin: "与武安傩戏、民间人物表演和地方戏剧传统相关。",
    visual: "头部圆润饱满，橙褐色面部，表情含笑，造型简洁醒目。",
    meaning: "民间喜剧角色，与《大头和尚戏柳翠》等剧目相关。其寓意偏向滑稽、戏谑与民间娱乐，圆润的大头形象和诙谐表演象征俗世生活中的轻松、欲望。",
    quote: "戏柳翠，寓诙谐。"
  },
  "zhejiang-liuchoupo": {
    sourceId: "liu-choupo",
    regionLine: "浙江东阳傩戏",
    category: "丑角 / 世俗人物",
    role: "具有鲜明戏剧化和人物化特征，是傩戏中更接近世俗生活的角色。",
    function: "通过诙谐、夸张的人物表演拉近观众与傩戏的距离。",
    origin: "与东阳地方傩戏、民间戏曲人物和丑角传统相关。",
    visual: "面部白净，眉眼细致，腮红明显，具有鲜明人物识别度。",
    meaning: "属于世俗人物与丑角类角色，寓意诙谐、生活化和民间戏剧性。她以夸张动作、女性装扮和戏谑气质表现民间生活中的喜感与人情味。",
    quote: "不说不唱，以舞传神。"
  }
};

const stageOrder = [
  "guizhou-kaishan-mangjiang",
  "guizhou-xianfeng-xiaojie",
  "guizhou-huoshen-lingguan",
  "hubei-chenghuang-tudi",
  "jiangxi-leigong",
  "jiangxi-yinjiao",
  "hebei-datou-heshang",
  "zhejiang-liuchoupo"
];

const masks = stageOrder
  .map((id) => ({ ...(byId.get(id) || {}), ...(copy[id] || {}) }))
  .filter((mask) => mask.id)
  .map((mask) => ({
    ...mask,
    stageImage: `assets/images/masks-stage/${mask.id}-stage.png`,
    image: mask.image || `assets/images/masks/${mask.id}.png`,
    model: mask.model || `assets/models/masks/${mask.id}.glb`
  }));

const clouds = [
  ["cloud-10.svg", "2.2%", "20.8%", "22.2%", "-220px", "-90px"],
  ["cloud-09.svg", "29.4%", "16.8%", "15.8%", "-80px", "-190px"],
  ["cloud-08.svg", "13.8%", "58.8%", "18.8%", "-170px", "125px"],
  ["cloud-07.svg", "47.6%", "25.6%", "25.8%", "0", "-205px"],
  ["cloud-06.svg", "36.8%", "48.8%", "15.7%", "-60px", "165px"],
  ["cloud-05.svg", "51.6%", "62.2%", "16.4%", "70px", "185px"],
  ["cloud-04.svg", "72.8%", "18.8%", "10.4%", "95px", "-185px"],
  ["cloud-03.svg", "84.8%", "26.4%", "14.8%", "210px", "-105px"],
  ["cloud-02.svg", "72.4%", "52.8%", "13.6%", "150px", "112px"],
  ["cloud-01.svg", "87.8%", "57.5%", "20.2%", "230px", "140px"]
];

let activeIndex = 0;
let isAnimatingCard = false;
let canvasFallbackStop = null;

function assetPath(path) {
  if (window.NuoRouter?.asset) return window.NuoRouter.asset(path);
  return `../${path}`;
}

function persistSelected(index = activeIndex) {
  const mask = masks[index];
  if (mask) window.NuoState?.setSelectedMask?.(mask);
}

function renderClouds() {
  cloudField.innerHTML = clouds
    .map(
      ([file, left, top, width, fromX, fromY], index) => `
        <img
          class="masks-cloud"
          src="${assetPath(`assets/images/masks-stage/${file}`)}"
          alt=""
          style="--i:${index};--left:${left};--top:${top};--width:${width};--from-x:${fromX};--from-y:${fromY};"
        />
      `
    )
    .join("");
}

function renderRoles() {
  track.innerHTML = masks
    .map(
      (mask, index) => `
        <article class="mask-stage-role" data-index="${index}" style="--i:${index}">
          <div class="mask-stage-pedestal">
            <img src="${assetPath("assets/images/masks-stage/pedestal.svg")}" alt="" />
          </div>
          <button class="mask-stage-figure" type="button" aria-label="查看${mask.name}">
            <span class="mask-role-particles" aria-hidden="true"></span>
            <img class="mask-role-image" src="${assetPath(mask.stageImage)}" alt="${mask.name}" />
            <img class="mask-role-fallback" src="${assetPath(mask.image)}" alt="" />
          </button>
          <span class="mask-role-label">${mask.name}</span>
        </article>
      `
    )
    .join("");

  track.querySelectorAll(".mask-stage-role").forEach((role) => {
    const index = Number(role.dataset.index);
    role.addEventListener("click", () => {
      setActive(index);
      openInfoCard(index, role);
    });

    const image = role.querySelector(".mask-role-image");
    image.addEventListener("error", () => role.classList.add("use-mask-fallback"));
  });
}

function updateTrack() {
  if (!viewport || !track) return;
  const roles = [...track.querySelectorAll(".mask-stage-role")];
  const current = roles[activeIndex];
  const last = roles[roles.length - 1];
  if (!current || !last) return;
  const viewportWidth = viewport.clientWidth;
  const currentCenter = current.offsetLeft + current.offsetWidth / 2;
  const totalWidth = last.offsetLeft + last.offsetWidth + Math.max(80, viewportWidth * 0.05);
  const target = viewportWidth / 2 - currentCenter;
  const min = Math.min(0, viewportWidth - totalWidth);
  const shift = Math.max(min, Math.min(0, target));

  track.style.setProperty("--stage-shift", `${shift}px`);
  roles.forEach((role, index) => {
    const distance = Math.min(Math.abs(index - activeIndex), 4);
    role.classList.toggle("is-active", index === activeIndex);
    role.style.setProperty("--distance", distance);
  });
}

function setActive(index) {
  activeIndex = (index + masks.length) % masks.length;
  persistSelected(activeIndex);
  updateTrack();
}

function move(step) {
  setActive(activeIndex + step);
}

function openInfoCard(index, roleElement) {
  if (isAnimatingCard) return;
  const mask = masks[index];
  const rect = roleElement.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height * 0.42;

  isAnimatingCard = true;
  detail.setAttribute("aria-hidden", "false");
  detail.className = "mask-info-overlay is-open";
  detail.style.setProperty("--origin-x", `${originX}px`);
  detail.style.setProperty("--origin-y", `${originY}px`);
  detail.innerHTML = `
    <article class="mask-flip-card">
      <button class="mask-card-close" type="button">收起</button>
      <div class="mask-card-shell">
        <div class="mask-card-layout">
          <div class="mask-card-portrait">
            <img src="${assetPath(mask.image)}" alt="${mask.name}" />
          </div>
          <div class="mask-card-copy">
            <h2>${mask.name}</h2>
            <p class="mask-card-region">${mask.regionLine || mask.region}</p>
            <section>
              <b>寓意简介</b>
              <p>${mask.meaning}</p>
            </section>
            <p class="mask-card-quote">“${mask.quote}”</p>
          </div>
        </div>
      </div>
    </article>
  `;

  detail.querySelector(".mask-card-close").addEventListener("click", closeInfoCard);
  window.setTimeout(() => {
    isAnimatingCard = false;
  }, 720);
}

function closeInfoCard() {
  if (isAnimatingCard) return;
  const card = detail.querySelector(".mask-flip-card");
  if (!card) return;
  isAnimatingCard = true;
  detail.classList.add("is-dispersing");
  spawnCardParticles(card);
  window.setTimeout(() => {
    detail.className = "mask-info-overlay";
    detail.setAttribute("aria-hidden", "true");
    detail.innerHTML = "";
    isAnimatingCard = false;
  }, 760);
}

function spawnCardParticles(card) {
  const rect = card.getBoundingClientRect();
  for (let i = 0; i < 90; i += 1) {
    const particle = document.createElement("span");
    particle.className = "mask-card-particle";
    particle.style.left = `${rect.left + Math.random() * rect.width}px`;
    particle.style.top = `${rect.top + Math.random() * rect.height}px`;
    particle.style.setProperty("--dx", `${(Math.random() - 0.5) * 420}px`);
    particle.style.setProperty("--dy", `${(Math.random() - 0.5) * 360}px`);
    particle.style.setProperty("--delay", `${Math.random() * 140}ms`);
    detail.appendChild(particle);
  }
}

async function initOrbitParticles() {
  try {
    const THREE = await import("three");
    initThreeOrbit(THREE);
  } catch (error) {
    initCanvasOrbit();
  }
}

function getRoleCenters() {
  return [...track.querySelectorAll(".mask-stage-role")].map((role) => {
    const rect = role.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    return {
      x: rect.left - stageRect.left + rect.width / 2,
      y: rect.top - stageRect.top + rect.height * 0.42,
      width: rect.width,
      height: rect.height,
      radiusX: Math.max(72, rect.width * 0.28),
      radiusY: Math.max(118, rect.height * 0.34)
    };
  });
}

function initThreeOrbit(THREE) {
  const renderer = new THREE.WebGLRenderer({ canvas: orbitCanvas, alpha: true, antialias: true });
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
  const particlesPerRole = 230;
  const positions = new Float32Array(masks.length * particlesPerRole * 3);
  const colors = new Float32Array(masks.length * particlesPerRole * 3);
  const palette = [
    new THREE.Color(0xef6f2a),
    new THREE.Color(0xf0d18a),
    new THREE.Color(0xfff6dd),
    new THREE.Color(0xf08a62)
  ];
  const seeds = Array.from({ length: masks.length * particlesPerRole }, () => ({
    angle: Math.random() * Math.PI * 2,
    speed: 0.38 + Math.random() * 1.35,
    depth: Math.random(),
    band: Math.random() * 2 - 1,
    drift: Math.random() * Math.PI * 2,
    radius: 0.42 + Math.random() * 0.92,
    color: Math.floor(Math.random() * palette.length)
  }));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  seeds.forEach((seed, index) => {
    const color = palette[seed.color];
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  });
  const material = new THREE.PointsMaterial({
    size: 1.45,
    transparent: true,
    opacity: 0.82,
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  function resize() {
    const rect = stage.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.right = rect.width;
    camera.bottom = rect.height;
    camera.updateProjectionMatrix();
  }

  function animate(time) {
    resize();
    const centers = getRoleCenters();
    let cursor = 0;
    centers.forEach((center, roleIndex) => {
      for (let i = 0; i < particlesPerRole; i += 1) {
        const seed = seeds[roleIndex * particlesPerRole + i];
        const t = time * 0.001 * seed.speed;
        const phase = seed.angle + t + Math.sin(t * 0.55 + seed.drift) * 0.58;
        const vertical = seed.band * center.height * 0.36 + Math.sin(t * 1.7 + seed.drift) * 42;
        const radiusFalloff = 1 - Math.min(0.75, Math.abs(seed.band) * 0.36);
        const rx = center.radiusX * seed.radius * radiusFalloff;
        const depthPush = (seed.depth - 0.5) * 72;
        positions[cursor++] = center.x + Math.cos(phase) * rx + depthPush + Math.sin(t * 2.3 + seed.drift) * 22;
        positions[cursor++] = center.y + vertical + Math.sin(phase * 1.3 + seed.drift) * 36;
        positions[cursor++] = (seed.depth - 0.5) * 8;
      }
    });
    geometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  requestAnimationFrame(animate);
}

function initCanvasOrbit() {
  const ctx = orbitCanvas.getContext("2d");
  let frame = 0;

  function resize() {
    const rect = stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    orbitCanvas.width = Math.floor(rect.width * dpr);
    orbitCanvas.height = Math.floor(rect.height * dpr);
    orbitCanvas.style.width = `${rect.width}px`;
    orbitCanvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    resize();
    frame += 1;
    ctx.clearRect(0, 0, orbitCanvas.width, orbitCanvas.height);
    getRoleCenters().forEach((center, roleIndex) => {
      for (let i = 0; i < 132; i += 1) {
        const seed = (Math.sin(i * 999 + roleIndex * 71) + 1) / 2;
        const phase = i * 1.78 + frame * (0.008 + seed * 0.012) + roleIndex * 0.44;
        const band = Math.sin(i * 2.41);
        const x = center.x + Math.cos(phase) * center.radiusX * (0.55 + seed * 0.55) + Math.sin(frame * 0.025 + i) * 18;
        const y = center.y + band * center.height * 0.31 + Math.sin(phase * 1.2) * 30;
        ctx.globalAlpha = 0.22 + seed * 0.5;
        ctx.fillStyle = seed > 0.78 ? "rgba(255, 246, 221, 0.82)" : seed > 0.48 ? "rgba(240, 209, 138, 0.72)" : "rgba(239, 111, 42, 0.72)";
        ctx.beginPath();
        ctx.arc(x, y, 0.75 + seed * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    canvasFallbackStop = requestAnimationFrame(draw);
  }

  draw();
}

renderClouds();
renderRoles();
setActive(0);
window.setTimeout(initOrbitParticles, 1450);

prevButton?.addEventListener("click", () => move(-1));
nextButton?.addEventListener("click", () => move(1));
enterButton?.addEventListener("click", () => persistSelected(activeIndex));
window.addEventListener("resize", updateTrack);

let lastWheelAt = 0;
viewport?.addEventListener(
  "wheel",
  (event) => {
    const now = Date.now();
    if (now - lastWheelAt < 280) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 8) return;
    event.preventDefault();
    lastWheelAt = now;
    move(delta > 0 ? 1 : -1);
  },
  { passive: false }
);

window.addEventListener("beforeunload", () => {
  if (canvasFallbackStop) cancelAnimationFrame(canvasFallbackStop);
});
