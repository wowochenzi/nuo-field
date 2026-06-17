(function () {
  const container = document.getElementById("canvas-container");
  const loading = document.getElementById("loading");
  const introPanel = document.querySelector("[data-reveal-intro]");
  const infoCard = document.querySelector("[data-info-card]");
  const cardBackdrop = document.querySelector("[data-card-backdrop]");
  const closeCardButton = document.querySelector("[data-close-card]");
  const cardHero = document.querySelector("[data-card-hero]");
  const cardPerson = document.querySelector("[data-card-person]");
  const cardTitle = document.querySelector("[data-card-title]");
  const cardRegion = document.querySelector("[data-card-region]");
  const cardBody = document.querySelector("[data-card-body]");
  const cardQuote = document.querySelector("[data-card-quote]");
  const next = document.getElementById("enterMusic");
  const clearImages = new Map(
    Array.from(document.querySelectorAll("[data-artifact-image]")).map((image) => [
      image.dataset.artifactImage,
      image
    ])
  );
  const artifactLabels = new Map(
    Array.from(document.querySelectorAll(".faqi-vertical-label")).map((label, index) => [
      `faqi${index + 1}`,
      label
    ])
  );

  if (!container) return;
  document.body.classList.add("reveal-ready");

  const asset = (path) => NuoRouter.asset(`assets/images/instruments/${path}`);
  const artifactInfo = {
    faqi1: {
      title: "开山斧",
      region: "江西石邮傩、西南各区域",
      body: "傩神庙开坛、开辟神道的核心法器，代表人类征服自然、战胜魔鬼的深沉力量与狞厉风格。",
      quote: "“巨斧开山劈险路，<br>斩妖除魔护安宁。”",
      heroImage: asset("cards/small-faqi-1.png"),
      personImage: asset("faqi_1.png")
    },
    faqi2: {
      title: "令旗",
      region: "贵州福泉阳戏等西南傩戏",
      body: "内坛法事调兵遣将、传达神谕的印信，蕴含浓厚的道、巫色彩，象征特定神灵的降临。",
      quote: "“将师凭印信，兵马听号令。”",
      heroImage: asset("cards/small-faqi-2.png"),
      personImage: asset("faqi_2.png")
    },
    faqi3: {
      title: "先师角",
      region: "中国西南地区及长江流域<br>（如贵、湘、川、桂）",
      body: "借牛角阳刚锐利的物理属性，震慑魑魅魍魉，荡涤污秽灾厄，将凡间祈愿上达天庭，象征法师的最高神权，吹响角号以调遣神兵神将降临护法。",
      quote: "“三声神号，玉皇遣兵。”",
      heroImage: asset("cards/small-faqi-3.png"),
      personImage: asset("faqi_3.png")
    },
    faqi4: {
      title: "锣鼓",
      region: "贯穿全国（如江西石邮傩、<br>贵州德江冲寿傩）",
      body: "构成傩戏声场的通神媒介，奏响三声即可请神，具有“倒乾坤”、“长日月”的磅礴能量。",
      quote: "“击鼓呼噪，以逐疫疠。”",
      heroImage: asset("cards/small-faqi-4.png"),
      personImage: asset("faqi_4.png")
    },
    faqi5: {
      title: "师刀",
      region: "贵州德江、<br>湘西土家族“冲寿傩”等",
      body: "傩仪法事中最主要的巫具，通过柄端铁环摇动发出的“沙沙”声，达到惊醒神灵、驱逐恶魔邪鬼的作用。",
      quote: "“师刀摇动惊鬼神，<br>环音清脆荡幽魂。”",
      heroImage: asset("cards/small-faqi-5.png"),
      personImage: asset("faqi_5.png")
    }
  };

  const assetConfigs = [
    { id: "faqi1", img: asset("faqi_1.png"), fallback: asset("kaishanfu.png") },
    { id: "faqi2", img: asset("faqi_2.png"), fallback: asset("lingqi.png") },
    { id: "faqi3", img: asset("faqi_3.png"), fallback: asset("toufu.png") },
    { id: "faqi4", img: asset("faqi_4.png"), fallback: asset("luogu.png") },
    { id: "faqi5", img: asset("faqi_5.png"), fallback: asset("shidao.png") }
  ];

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: true });
  container.appendChild(canvas);

  const instances = [];
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dpr = 1;
  let width = 1;
  let height = 1;
  let canvasLeft = 0;
  let canvasTop = 0;
  let introShown = false;
  let activeCardInstance = null;
  let animationFrame = 0;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function smoothstep(value) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`图片加载失败：${src}`));
      image.src = src;
    });
  }

  function loadConfiguredImage(config) {
    return loadImage(config.img).catch(() => loadImage(config.fallback));
  }

  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvasLeft = rect.left;
    canvasTop = rect.top;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateLayout();
  }

  function sampleImage(image, id) {
    const sampler = document.createElement("canvas");
    const samplerCtx = sampler.getContext("2d", { willReadFrequently: true });
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    const baseStep = Math.max(5, Math.round(Math.max(imageWidth, imageHeight) / 210));
    const step = id === "faqi3" ? 2 : baseStep;
    const particles = [];

    sampler.width = imageWidth;
    sampler.height = imageHeight;
    samplerCtx.drawImage(image, 0, 0);
    const pixels = samplerCtx.getImageData(0, 0, imageWidth, imageHeight).data;

    for (let y = 0; y < imageHeight; y += step) {
      for (let x = 0; x < imageWidth; x += step) {
        const offset = (y * imageWidth + x) * 4;
        const alpha = pixels[offset + 3];
        if (alpha <= 80) continue;

        const normalizedX = x / imageWidth;
        const normalizedY = y / imageHeight;
        const angle = Math.atan2(normalizedY - 0.5, normalizedX - 0.5);
        const scatter = 12 + Math.random() * 34;

        particles.push({
          x: normalizedX,
          y: normalizedY,
          red: pixels[offset],
          green: pixels[offset + 1],
          blue: pixels[offset + 2],
          alpha: alpha / 255,
          delay: Math.random() * 0.42,
          driftX: Math.cos(angle) * scatter + (Math.random() - 0.5) * 12,
          driftY: Math.sin(angle) * scatter + (Math.random() - 0.5) * 12,
          phase: Math.random() * Math.PI * 2,
          size: 0.22 + Math.random() * 0.46
        });
      }
    }

    return {
      id,
      image,
      imageWidth,
      imageHeight,
      particles,
      reveal: 0,
      targetReveal: 0,
      pulse: 0,
      x: 0,
      y: 0,
      drawWidth: 1,
      drawHeight: 1,
      resolved: false,
      resolveProgress: 0,
      revealed: false
    };
  }

  function updateLayout() {
    if (!instances.length) return;

    const stageWidth = Math.min(width, 1720);
    const stageLeft = (width - stageWidth) / 2;
    const isMobile = width <= 700;
    const leftPercents = isMobile ? [0.1, 0.31, 0.5, 0.69, 0.9] : [0.118, 0.328, 0.513, 0.704, 0.892];
    const imageTop = isMobile ? clamp(height * 0.19, 92, 144) : clamp(height * 0.145, 102, 146);
    const baseWidth = isMobile ? Math.min(width * 0.31, 205) : Math.min(width * 0.17, 300);
    const thirdWidth = isMobile ? Math.min(width * 0.35, 235) : Math.min(width * 0.19, 330);

    instances.forEach((inst, index) => {
      const ratio = inst.imageWidth / inst.imageHeight;
      const targetWidth = inst.id === "faqi3" ? thirdWidth : baseWidth;
      inst.drawWidth = targetWidth;
      inst.drawHeight = targetWidth / ratio;

      inst.x = stageLeft + stageWidth * leftPercents[index];
      inst.y = imageTop + inst.drawHeight / 2;
    });
  }

  function showIntroPanel() {
    if (introShown || !introPanel) return;
    introShown = true;
    introPanel.classList.add("is-visible");
  }

  function updateClearImage(inst, progress) {
    const image = clearImages.get(inst.id);
    if (!image) return;

    const imageProgress = smoothstep((progress - 0.16) / 0.84);
    const glowProgress = smoothstep((progress - 0.34) / 0.66);
    const resolvedBlend = smoothstep(inst.resolveProgress);
    const unresolvedOpacity = 0;
    const resolvedOpacity = imageProgress;
    const unresolvedBlur = 14 * (1 - imageProgress) + 2.4 * imageProgress;
    const resolvedBlur = 14 * (1 - imageProgress);
    const unresolvedBrightness = 0.1 + imageProgress * 0.72;
    const resolvedBrightness = 0.1 + imageProgress * 0.9;
    const unresolvedSaturation = 0.68 + imageProgress * 0.18;
    const resolvedSaturation = 0.68 + imageProgress * 0.32;
    const opacity = unresolvedOpacity + (resolvedOpacity - unresolvedOpacity) * resolvedBlend;
    const blur = unresolvedBlur + (resolvedBlur - unresolvedBlur) * resolvedBlend;
    const brightness = unresolvedBrightness + (resolvedBrightness - unresolvedBrightness) * resolvedBlend;
    const saturation = unresolvedSaturation + (resolvedSaturation - unresolvedSaturation) * resolvedBlend;
    const translateY = 6 * (1 - imageProgress) * (1 - resolvedBlend * 0.35);
    const scale = 0.965 + imageProgress * (0.026 + resolvedBlend * 0.009);
    const shadowOpacity = 0.12 + glowProgress * (0.3 + resolvedBlend * 0.08);

    image.style.opacity = String(opacity);
    image.style.filter = `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(3)}) saturate(${saturation.toFixed(3)}) drop-shadow(0 0 24px rgba(250, 185, 144, ${shadowOpacity.toFixed(3)}))`;
    image.style.transform = `translateX(-50%) translateY(${translateY.toFixed(2)}px) scale(${scale.toFixed(4)})`;
  }

  function maybeCompleteInstruments() {
    if (instances.length && instances.every((inst) => inst.resolved)) {
      NuoState.markComplete("completedInstruments");
    }
  }

  function resolveArtifact(instance) {
    if (!instance || instance.resolved) return;
    instance.resolved = true;
    clearImages.get(instance.id)?.classList.add("is-resolved");
    maybeCompleteInstruments();
  }

  function showInfoCard(instance) {
    const id = instance.id;
    const info = artifactInfo[id];
    if (!info || !infoCard) return;

    cardTitle.textContent = info.title;
    cardRegion.innerHTML = info.region;
    cardBody.textContent = info.body;
    cardQuote.innerHTML = info.quote;
    cardHero.src = info.heroImage;
    cardPerson.src = info.personImage;
    activeCardInstance = instance;
    infoCard.dataset.activeId = id;
    infoCard.setAttribute("aria-hidden", "false");
    document.body.classList.add("card-open");
    window.NuoAudio?.playNoise?.(0.16);
  }

  function closeInfoCard() {
    if (!infoCard) return;
    const wasOpen = infoCard.getAttribute("aria-hidden") === "false";
    infoCard.setAttribute("aria-hidden", "true");
    document.body.classList.remove("card-open");
    if (wasOpen) resolveArtifact(activeCardInstance);
    activeCardInstance = null;
  }

  function playRevealSequence() {
    const interval = 600;
    instances.forEach((inst, index) => {
      window.setTimeout(() => {
        inst.targetReveal = 1;
        window.setTimeout(() => {
          artifactLabels.get(inst.id)?.classList.add("is-visible");
        }, prefersReducedMotion ? 0 : 320);

        if (index === instances.length - 1) {
          window.setTimeout(showIntroPanel, prefersReducedMotion ? 0 : 2400);
        }
      }, prefersReducedMotion ? 0 : index * interval);
    });
  }

  function drawInstance(inst, now) {
    if (inst.reveal < inst.targetReveal) {
      inst.reveal = Math.min(inst.targetReveal, inst.reveal + (prefersReducedMotion ? 1 : 0.009));
    }

    if (inst.pulse > 0.001) {
      inst.pulse += (0 - inst.pulse) * 0.12;
    } else {
      inst.pulse = 0;
    }

    if (inst.resolved && inst.resolveProgress < 1) {
      inst.resolveProgress = Math.min(1, inst.resolveProgress + (prefersReducedMotion ? 1 : 0.06));
    }

    const baseProgress = easeOutCubic(inst.reveal);
    updateClearImage(inst, baseProgress);
    const imageOpacity = clamp((baseProgress - 0.38) / 0.62, 0, 1);
    const resolvedBlend = smoothstep(inst.resolveProgress);
    const particleFade = (0.92 + (1 - imageOpacity) * 0.18) * (1 - resolvedBlend) + (1 - imageOpacity * 0.82) * resolvedBlend;
    const left = inst.x - inst.drawWidth / 2;
    const top = inst.y - inst.drawHeight / 2;
    const rot = Math.sin(now * 0.0004) * 0.035;
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (const particle of inst.particles) {
      const localProgress = clamp((baseProgress - particle.delay) / (1 - particle.delay), 0, 1);
      const progress = easeOutCubic(localProgress);
      const targetX = left + particle.x * inst.drawWidth;
      const targetY = top + particle.y * inst.drawHeight;
      const centerX = targetX - inst.x;
      const centerY = targetY - inst.y;
      const rotatedX = centerX * cos - centerY * sin + inst.x;
      const rotatedY = centerX * sin + centerY * cos + inst.y;
      const wave = Math.sin(now * 0.00125 + particle.phase) * 0.56;
      const pulse = inst.pulse * (6 + particle.size * 4);
      const x = rotatedX + particle.driftX * (1 - progress) + Math.cos(particle.phase) * pulse;
      const y = rotatedY + particle.driftY * (1 - progress) + wave + Math.sin(particle.phase) * pulse;
      const alpha = particle.alpha * (0.12 + progress * 0.68) * particleFade;
      const glow = 0.9 + progress * 1.72 + inst.pulse * 1.6;
      const size = particle.size + progress * 0.28 + inst.pulse * 1.02;

      ctx.beginPath();
      ctx.fillStyle = progress < 0.12
        ? `rgba(7, 4, 3, ${alpha})`
        : `rgba(${Math.min(255, particle.red * glow)}, ${Math.min(255, particle.green * glow)}, ${Math.min(255, particle.blue * glow)}, ${alpha})`;
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    inst.revealed = inst.reveal > 0.9;
  }

  function animate(now) {
    ctx.clearRect(0, 0, width, height);
    instances.forEach((inst) => drawInstance(inst, now));
    animationFrame = window.requestAnimationFrame(animate);
  }

  function findHit(localX, localY) {
    for (let index = instances.length - 1; index >= 0; index -= 1) {
      const inst = instances[index];
      const left = inst.x - inst.drawWidth / 2;
      const right = inst.x + inst.drawWidth / 2;
      const top = inst.y - inst.drawHeight / 2;
      const bottom = inst.y + inst.drawHeight / 2;

      if (localX >= left && localX <= right && localY >= top && localY <= bottom) {
        return inst;
      }
    }

    return null;
  }

  window.addEventListener("click", (event) => {
    if (event.target.closest(".interactive, .faqi-info-card, .faqi-card-backdrop")) return;

    const targetInstance = findHit(event.clientX - canvasLeft, event.clientY - canvasTop);
    if (!targetInstance) {
      closeInfoCard();
      return;
    }

    if (targetInstance.revealed) {
      targetInstance.pulse = 1;
      showInfoCard(targetInstance);
    }
  });

  cardBackdrop?.addEventListener("click", closeInfoCard);
  closeCardButton?.addEventListener("click", closeInfoCard);
  next?.addEventListener("click", () => {
    NuoState.markComplete("completedInstruments");
    NuoRouter.go("pages/music.html");
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeInfoCard();
  });

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(animationFrame);
  });

  resizeCanvas();
  animationFrame = window.requestAnimationFrame(animate);

  Promise.allSettled(
    assetConfigs.map((config) =>
      loadConfiguredImage(config).then((image) => {
        const instance = sampleImage(image, config.id);
        instances.push(instance);
        return instance;
      })
    )
  )
    .then((results) => {
      const failedCount = results.filter((result) => result.status === "rejected").length;

      if (!instances.length) {
        throw new Error("所有法器图片都加载失败");
      }

      instances.sort((a, b) => assetConfigs.findIndex((item) => item.id === a.id) - assetConfigs.findIndex((item) => item.id === b.id));
      updateLayout();
      if (loading) loading.classList.add("is-hidden");
      playRevealSequence();

      if (failedCount > 0) {
        console.warn(`有 ${failedCount} 张法器图片走了备用路径。`);
      }
    })
    .catch((error) => {
      console.error(error);
      if (loading) loading.textContent = "正在重新加载法器图片...";
    });
})();
