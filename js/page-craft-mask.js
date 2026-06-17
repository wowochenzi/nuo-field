const selectedMask = window.NuoState?.getSelectedMask?.() || {
  id: "guizhou-kaishan-mangjiang",
  image: "assets/images/craft-demo/workspace-polished.png"
};
document.body.dataset.maskId = selectedMask.id;
const isKaishanDemoMask = selectedMask.id === "guizhou-kaishan-mangjiang";
const usesKaishanCraftVideo = selectedMask.id === "guizhou-kaishan-mangjiang";

const stages = [
  {
    id: "initial",
    figmaFrame: "匠作成面1",
    label: "画型",
    activeTool: "pencil",
    workspaceImage: "../assets/images/craft-demo/workspace-initial.png",
    currentStepTitle: "当前步骤：\n画型",
    currentStepDesc: "在木胚表面绘制面具草稿，标出五官位置、纹样走向和装饰结构，为后续雕刻提供清晰参考。",
    hint: "请使用铅笔，在木胚表面勾勒草稿。",
    stepIcon: "icon-draw",
    next: "draw"
  },
  {
    id: "draw",
    figmaFrame: "匠作成面-画型",
    label: "雕刻",
    activeTool: "knife",
    workspaceImage: "../assets/images/craft-demo/workspace-draw.png",
    currentStepTitle: "当前步骤：\n雕刻",
    currentStepDesc: "雕刻是制作面具的核心环节，需要沿线稿逐步刻出面具轮廓和图案，从大形到细节塑造角色神态。",
    hint: "请使用刻刀，沿线稿雕刻出面具轮廓。",
    stepIcon: "icon-carve",
    next: "carveProgress"
  },
  {
    id: "carveProgress",
    figmaFrame: "匠作成面-雕刻过程",
    label: "雕刻",
    activeTool: "knife",
    workspaceImage: "../assets/images/craft-demo/workspace-carve-progress.png",
    currentStepTitle: "当前步骤：\n雕刻",
    currentStepDesc: "雕刻是制作面具的核心环节，需要沿线稿逐步刻出面具轮廓和图案，从大形到细节塑造角色神态。",
    hint: "继续使用刻刀，完善面具层次。",
    stepIcon: "icon-carve",
    next: "carved"
  },
  {
    id: "carved",
    figmaFrame: "匠作成面-雕刻",
    label: "上色",
    activeTool: "brush",
    workspaceImage: "../assets/images/craft-demo/workspace-carved.png",
    currentStepTitle: "当前步骤：\n雕刻",
    currentStepDesc: "雕刻是制作面具的核心环节，需要沿线稿逐步刻出面具轮廓和图案，从大形到细节塑造角色神态。",
    hint: "请使用毛笔，为面具添加传统色彩。",
    stepIcon: "icon-carve",
    next: "painted"
  },
  {
    id: "painted",
    figmaFrame: "匠作成面-上色",
    label: "打磨",
    activeTool: "sandpaper",
    workspaceImage: "../assets/images/craft-demo/workspace-painted.png",
    currentStepTitle: "当前步骤：\n上色",
    currentStepDesc: "根据面具角色的性格与寓意进行配色，用红、黑、白等传统色彩强化表情特征，使面具更具视觉冲击力。",
    hint: "请使用打磨纸，修整表面与边缘细节。",
    stepIcon: "icon-paint",
    next: "polished"
  },
  {
    id: "polished",
    figmaFrame: "匠作成面-打磨",
    label: "完成",
    activeTool: null,
    workspaceImage: "../assets/images/craft-demo/workspace-polished.png",
    currentStepTitle: "制作完成",
    currentStepDesc: "面具已经完成最后修整，完整呈现出傩面具庄重、神秘而富有力量感的形象。",
    hint: "面具制作完成，点击面具进行佩戴。",
    stepIcon: "icon-complete",
    next: null
  }
];

if (!isKaishanDemoMask) {
  stages.forEach((stage) => {
    stage.workspaceImage = `../assets/images/masks-craft/${selectedMask.id}/${stage.id}.png`;
  });
}

const tools = [
  { id: "pencil", name: "铅笔", icon: "../assets/images/craft-demo/tool-pencil.png", iconClass: "tool-pencil" },
  { id: "knife", name: "刻刀", icon: "../assets/images/craft-demo/tool-knife.png", iconClass: "tool-knife" },
  { id: "brush", name: "毛笔", icon: "../assets/images/craft-demo/tool-brush.png", iconClass: "tool-brush" },
  { id: "sandpaper", name: "打磨纸", icon: "../assets/images/craft-demo/tool-sandpaper.png", iconClass: "tool-sandpaper" }
];

const audioSettings = {
  pencil: { type: "scratch", volume: 0.06, filter: 2400, rhythm: 90 },
  knife: { type: "tap", volume: 0.08, filter: 1200, rhythm: 135 },
  brush: { type: "swish", volume: 0.055, filter: 850, rhythm: 160 },
  sandpaper: { type: "sand", volume: 0.08, filter: 3600, rhythm: 75 }
};

const processSteps = [
  { id: "wood", name: "选木", icon: "../assets/images/craft-demo/step-icons/step-wood.png" },
  { id: "cut", name: "切割", icon: "../assets/images/craft-demo/step-icons/step-cut.png" },
  { id: "draw", name: "画型", icon: "../assets/images/craft-demo/step-icons/step-draw.png" },
  { id: "carve", name: "雕刻", icon: "../assets/images/craft-demo/step-icons/step-carve.png" },
  { id: "paint", name: "上色", icon: "../assets/images/craft-demo/step-icons/step-paint.png" },
  { id: "polish", name: "打磨", icon: "../assets/images/craft-demo/step-icons/step-polish.png" }
];

const stageById = new Map(stages.map((stage) => [stage.id, stage]));
const transitionVideos = usesKaishanCraftVideo
  ? {
      draw: "../assets/video/1.webm"
    }
  : {};
const transitionVideoStartTimes = {
  draw: 1
};
const softFadeStages = new Set(["carveProgress", "carved", "painted"]);
const carveShakeStages = new Set(["carveProgress", "carved"]);
const carveTransitionMs = 4000;

const state = {
  stageId: "initial",
  isTransitioning: false,
  selectedTool: null,
  dragging: null,
  audioContext: null
};

const els = {
  backButton: document.querySelector(".back-button"),
  stepGrid: document.getElementById("stepGrid"),
  currentStepCard: document.getElementById("currentStepCard"),
  currentStepIcon: document.getElementById("currentStepIcon"),
  currentStepTitle: document.getElementById("currentStepTitle"),
  currentStepDesc: document.getElementById("currentStepDesc"),
  workspace: document.getElementById("workspace"),
  workspaceInner: document.getElementById("workspaceInner"),
  workspaceImage: document.getElementById("workspaceImage"),
  toolList: document.getElementById("toolList"),
  bottomHint: document.getElementById("bottomHint"),
  hintText: document.getElementById("hintText"),
  dragGhost: document.getElementById("dragGhost")
};

function currentStage() {
  return stageById.get(state.stageId);
}

function getAudioContext() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    state.audioContext = new AudioContextClass();
  }

  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }

  return state.audioContext;
}

function initCraftNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (!header || !toggle || !nav) return;

  const setOpen = (open) => {
    header.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "收起" : "导航栏";
  };

  toggle.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!header.classList.contains("is-nav-open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("click", (event) => {
    if (!header.contains(event.target)) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function makeNoiseBuffer(context, duration = 0.5) {
  const sampleCount = Math.max(1, Math.floor(context.sampleRate * duration));
  const buffer = context.createBuffer(1, sampleCount, context.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  return buffer;
}

function playToolSound(toolId) {
  const settings = audioSettings[toolId];
  const context = getAudioContext();
  if (!settings || !context) return () => {};

  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(settings.volume, context.currentTime + 0.08);
  master.connect(context.destination);

  const nodes = [master];
  const timers = [];

  const stop = () => {
    const now = context.currentTime;
    timers.forEach((timer) => window.clearInterval(timer));
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    window.setTimeout(() => {
      nodes.forEach((node) => {
        try {
          if (typeof node.stop === "function") node.stop();
          if (typeof node.disconnect === "function") node.disconnect();
        } catch (error) {
          // Audio nodes may already be stopped by the browser.
        }
      });
    }, 220);
  };

  const addNoiseLoop = (filterType, frequency, gainValue) => {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    source.buffer = makeNoiseBuffer(context, 0.45);
    source.loop = true;
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    gain.gain.value = gainValue;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start();
    nodes.push(source, filter, gain);
    return { filter, gain };
  };

  if (settings.type === "tap") {
    addNoiseLoop("bandpass", settings.filter, 0.16);
    const timer = window.setInterval(() => {
      const osc = context.createOscillator();
      const hitGain = context.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(260 + Math.random() * 80, context.currentTime);
      hitGain.gain.setValueAtTime(0.18, context.currentTime);
      hitGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.055);
      osc.connect(hitGain);
      hitGain.connect(master);
      osc.start();
      osc.stop(context.currentTime + 0.06);
    }, settings.rhythm);
    timers.push(timer);
  } else if (settings.type === "swish") {
    const loop = addNoiseLoop("lowpass", settings.filter, 0.65);
    const timer = window.setInterval(() => {
      loop.filter.frequency.setTargetAtTime(650 + Math.random() * 700, context.currentTime, 0.06);
      loop.gain.gain.setTargetAtTime(0.38 + Math.random() * 0.35, context.currentTime, 0.04);
    }, settings.rhythm);
    timers.push(timer);
  } else if (settings.type === "sand") {
    const loop = addNoiseLoop("highpass", settings.filter, 0.7);
    const timer = window.setInterval(() => {
      loop.filter.frequency.setTargetAtTime(2800 + Math.random() * 1800, context.currentTime, 0.03);
      loop.gain.gain.setTargetAtTime(0.45 + Math.random() * 0.35, context.currentTime, 0.025);
    }, settings.rhythm);
    timers.push(timer);
  } else {
    const loop = addNoiseLoop("bandpass", settings.filter, 0.5);
    const timer = window.setInterval(() => {
      loop.filter.frequency.setTargetAtTime(1700 + Math.random() * 1600, context.currentTime, 0.025);
      loop.gain.gain.setTargetAtTime(0.28 + Math.random() * 0.32, context.currentTime, 0.02);
    }, settings.rhythm);
    timers.push(timer);
  }

  return stop;
}

function renderSteps(stage) {
  els.stepGrid.innerHTML = processSteps
    .map((step) => {
      const active = step.name === stage.label || (stage.id === "polished" && step.id === "polish");
      return `
        <li class="step-item ${active ? "is-active" : ""}">
          <img class="step-icon" src="${step.icon}" alt="" />
          <span>${step.name}</span>
        </li>
      `;
    })
    .join("");
}

function makeToolButton(tool) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "tool-button";
  button.dataset.tool = tool.id;
  button.setAttribute("aria-label", tool.name);
  button.innerHTML = `
    <span class="tool-icon-wrap" aria-hidden="true">
      <img class="tool-icon ${tool.iconClass}" src="${tool.icon}" alt="" />
    </span>
    <span class="tool-name">${tool.name}</span>
  `;
  const toolIcon = button.querySelector(".tool-icon");
  toolIcon.addEventListener("pointerdown", onPointerDown);
  toolIcon.addEventListener("click", (event) => event.stopPropagation());
  button.addEventListener("click", () => selectTool(tool.id));
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectTool(tool.id);
    }
  });
  return button;
}

function renderTools() {
  els.toolList.innerHTML = "";
  tools.forEach((tool) => els.toolList.appendChild(makeToolButton(tool)));
}

function updateToolStates(stage) {
  document.querySelectorAll(".tool-button").forEach((button) => {
    const isActive = button.dataset.tool === stage.activeTool;
    button.classList.toggle("is-active", isActive);
    button.classList.toggle("is-disabled", Boolean(stage.activeTool) && !isActive);
    button.setAttribute("aria-pressed", String(state.selectedTool === button.dataset.tool));
  });
}

function updateText(stage, animate = true) {
  els.currentStepCard.classList.toggle("is-hidden", stage.id === "polished");

  const cardIsUnchanged =
    els.currentStepTitle.textContent === stage.currentStepTitle &&
    els.currentStepDesc.textContent === stage.currentStepDesc &&
    els.currentStepIcon.className === `current-step-icon ${stage.stepIcon}`;

  const apply = () => {
    els.currentStepTitle.textContent = stage.currentStepTitle;
    els.currentStepDesc.textContent = stage.currentStepDesc;
    els.currentStepIcon.className = `current-step-icon ${stage.stepIcon}`;
    els.hintText.textContent = stage.hint;
    renderSteps(stage);
    updateToolStates(stage);
  };

  if (!animate || cardIsUnchanged) {
    apply();
    return;
  }

  els.currentStepCard.classList.add("is-fading");
  window.setTimeout(() => {
    apply();
    els.currentStepCard.classList.remove("is-fading");
  }, 230);
}

function playWorkspaceVideo(stage) {
  const videoSrc = transitionVideos[stage.id];
  if (!videoSrc) return Promise.resolve(false);

  return new Promise((resolve) => {
    let didFinish = false;
    let animationFrame = 0;
    let playbackFallbackTimer = 0;
    const startAt = transitionVideoStartTimes[stage.id] || 0;
    const video = document.createElement("video");
    video.className = "workspace-transition-video";
    video.src = videoSrc;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("aria-hidden", "true");
    video.dataset.stage = stage.id;

    const canvas = document.createElement("canvas");
    canvas.className = "workspace-transition-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.dataset.stage = stage.id;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const stopDrawing = () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    const drawFrame = () => {
      if (didFinish || video.paused || video.ended) return;
      if (video.currentTime < startAt - 0.05) {
        animationFrame = requestAnimationFrame(drawFrame);
        return;
      }
      reveal();
      if (context && canvas.width && canvas.height) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frame.data;
        for (let index = 0; index < pixels.length; index += 4) {
          const max = Math.max(pixels[index], pixels[index + 1], pixels[index + 2]);
          if (max < 18) {
            pixels[index + 3] = 0;
          } else if (max < 42) {
            pixels[index + 3] = Math.round(pixels[index + 3] * ((max - 18) / 24));
          }
        }
        context.putImageData(frame, 0, 0);
      }
      animationFrame = requestAnimationFrame(drawFrame);
    };

    const reveal = () => {
      if (video.currentTime < startAt - 0.05) return;
      if (!context) {
        video.classList.add("is-visible");
      }
      canvas.classList.add("is-visible");
      els.workspaceImage.classList.add("is-video-transitioning");
      window.clearTimeout(loadFallbackTimer);
    };

    const finish = (played = true) => {
      if (didFinish) return;
      didFinish = true;
      window.clearTimeout(loadFallbackTimer);
      window.clearTimeout(playbackFallbackTimer);
      stopDrawing();
      video.classList.remove("is-visible");
      canvas.classList.remove("is-visible");
      window.setTimeout(() => {
        video.remove();
        canvas.remove();
        resolve(played);
      }, 180);
    };

    const loadFallbackTimer = window.setTimeout(() => {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) finish(false);
    }, 1800);

    const beginPlayback = () => {
      const playPromise = video.play();
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        reveal();
        if (!animationFrame) drawFrame();
      }
      if (playPromise?.catch) {
        playPromise
          .then(() => {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) reveal();
            if (!animationFrame) drawFrame();
          })
          .catch(() => finish(false));
      }
    };

    video.addEventListener("loadedmetadata", () => {
      const maxRenderWidth = 960;
      const renderScale = Math.min(1, maxRenderWidth / (video.videoWidth || maxRenderWidth));
      canvas.width = Math.max(1, Math.round((video.videoWidth || maxRenderWidth) * renderScale));
      canvas.height = Math.max(1, Math.round((video.videoHeight || 720) * renderScale));
      if (startAt > 0 && Number.isFinite(video.duration) && startAt < video.duration) {
        video.currentTime = startAt;
      } else {
        beginPlayback();
      }
      const maxPlayMs = Number.isFinite(video.duration) ? Math.max(500, (video.duration - startAt) * 1000 + 500) : 8000;
      window.clearTimeout(playbackFallbackTimer);
      playbackFallbackTimer = window.setTimeout(() => {
        finish(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
      }, maxPlayMs);
    }, { once: true });
    video.addEventListener("seeked", () => {
      beginPlayback();
    }, { once: true });
    video.addEventListener("loadeddata", reveal, { once: true });
    video.addEventListener("canplay", () => {
      reveal();
      if (!animationFrame) drawFrame();
    }, { once: true });
    video.addEventListener("ended", () => finish(true), { once: true });
    video.addEventListener("error", () => finish(false), { once: true });

    if (!context) {
      canvas.remove();
    } else {
      els.workspaceInner.appendChild(canvas);
    }
    els.workspaceInner.appendChild(video);
    if (!startAt && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      beginPlayback();
    }

    playbackFallbackTimer = window.setTimeout(() => {
      finish(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA);
    }, 8500);
  });
}

function transitionWorkspace(stage) {
  return new Promise((resolve) => {
    const nextImage = new Image();
    let fallbackApplied = false;
    nextImage.onload = () => {
      let didFinish = false;
      const finish = (transitionImage = null) => {
        if (didFinish) return;
        didFinish = true;
        els.workspaceImage.classList.add("is-swap-settling");
        els.workspaceImage.src = stage.workspaceImage;
        els.workspaceImage.dataset.stage = stage.id;
        els.workspaceImage.dataset.figmaFrame = stage.figmaFrame;
        els.workspaceImage.classList.remove("is-video-transitioning");
        els.workspaceImage.classList.remove("is-slow-transition");
        els.workspaceImage.classList.remove("is-carve-transition");
        els.workspaceImage.classList.remove("is-polish-transition");
        els.workspaceImage.classList.remove("is-carve-shake");
        els.workspaceImage.classList.remove("is-crossfading-out");
        void els.workspaceImage.offsetWidth;
        transitionImage?.remove();
        requestAnimationFrame(() => {
          els.workspaceImage.classList.remove("is-swap-settling");
        });
        resolve();
      };

      const runCrossfade = () => {
        const transitionImage = document.createElement("img");
        transitionImage.className = "workspace-image workspace-image-next";
        transitionImage.src = stage.workspaceImage;
        transitionImage.alt = "傩面具制作状态";
        transitionImage.dataset.stage = stage.id;
        transitionImage.dataset.figmaFrame = stage.figmaFrame;
        const isSoftFade = softFadeStages.has(stage.id);
        const isCarveShake = carveShakeStages.has(stage.id);
        transitionImage.classList.toggle("is-slow-transition", isSoftFade);
        transitionImage.classList.toggle("is-carve-transition", isCarveShake);
        transitionImage.classList.toggle("is-polish-transition", stage.id === "polished");
        transitionImage.classList.toggle("is-carve-shake", isCarveShake);

        els.workspaceInner.appendChild(transitionImage);
        void transitionImage.offsetWidth;

        requestAnimationFrame(() => {
          els.workspaceImage.classList.toggle("is-slow-transition", isSoftFade);
          els.workspaceImage.classList.toggle("is-carve-transition", isCarveShake);
          els.workspaceImage.classList.toggle("is-polish-transition", stage.id === "polished");
          els.workspaceImage.classList.toggle("is-carve-shake", isCarveShake);
          els.workspaceImage.classList.add("is-crossfading-out");
          transitionImage.classList.add("is-visible");
        });

        const transitionMs = isCarveShake ? carveTransitionMs : isSoftFade ? 4000 : stage.id === "polished" ? 3000 : 900;
        if (!isSoftFade && stage.id !== "polished") {
          transitionImage.addEventListener(
            "transitionend",
            () => finish(transitionImage),
            { once: true }
          );
        }

        window.setTimeout(() => {
          finish(transitionImage);
        }, transitionMs);
      };

      playWorkspaceVideo(stage).then((playedVideo) => {
        if (playedVideo) {
          finish();
          return;
        }
        runCrossfade();
      });
    };
    nextImage.onerror = () => {
      if (fallbackApplied) return;
      fallbackApplied = true;
      // Missing craft-process images fall back to the selected mask front image.
      // Replace assets/images/masks-craft/{maskId}/{stageId}.png when new process images arrive.
      stage.workspaceImage = `../${selectedMask.image}`;
      nextImage.src = stage.workspaceImage;
    };
    nextImage.src = stage.workspaceImage;
  });
}

async function goToStage(stageId, toolId = null) {
  const stage = stageById.get(stageId);
  if (!stage || state.isTransitioning) return;

  state.isTransitioning = true;
  state.selectedTool = null;
  els.workspace.classList.remove("is-complete");

  updateText(stage);
  const stopSound = playToolSound(toolId);
  try {
    await transitionWorkspace(stage);
  } finally {
    stopSound();
  }

  state.stageId = stage.id;
  if (stage.id === "polished") {
    els.workspace.classList.add("is-complete");
  }
  state.isTransitioning = false;
}

function goNextStep(toolId = null) {
  const stage = currentStage();
  if (!stage.next || state.isTransitioning) return;
  goToStage(stage.next, toolId);
}

function selectTool(toolId) {
  if (state.isTransitioning) return;
  state.selectedTool = state.selectedTool === toolId ? null : toolId;
  updateToolStates(currentStage());
}

function isPointInWorkspace(x, y) {
  const rect = els.workspace.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function buildGhost(toolId) {
  const tool = tools.find((item) => item.id === toolId);
  els.dragGhost.innerHTML = `
    <img class="tool-drag-image ${tool.iconClass}" src="${tool.icon}" alt="${tool.name}" />
  `;
}

function moveGhost(x, y) {
  els.dragGhost.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(1.04)`;
}

function onPointerDown(event) {
  if (state.isTransitioning || event.button > 0) return;

  event.preventDefault();
  event.stopPropagation();

  const button = event.currentTarget.closest(".tool-button");
  const toolId = button.dataset.tool;
  state.dragging = {
    toolId,
    pointerId: event.pointerId,
    started: false
  };

  event.currentTarget.setPointerCapture(event.pointerId);
  buildGhost(toolId);
  moveGhost(event.clientX, event.clientY);

  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp, { once: true });
  window.addEventListener("pointercancel", cancelDrag, { once: true });
}

function onPointerMove(event) {
  if (!state.dragging || event.pointerId !== state.dragging.pointerId) return;
  state.dragging.started = true;
  els.dragGhost.classList.add("is-visible");
  moveGhost(event.clientX, event.clientY);
  els.workspace.classList.toggle("is-over", isPointInWorkspace(event.clientX, event.clientY));
}

function onPointerUp(event) {
  if (!state.dragging || event.pointerId !== state.dragging.pointerId) return;

  const dropped = isPointInWorkspace(event.clientX, event.clientY);
  const draggedTool = state.dragging.toolId;
  cleanupDrag();

  if (!dropped) return;
  tryUseTool(draggedTool);
}

function cancelDrag() {
  cleanupDrag();
}

function cleanupDrag() {
  state.dragging = null;
  els.dragGhost.classList.remove("is-visible");
  els.workspace.classList.remove("is-over");
  window.removeEventListener("pointermove", onPointerMove);
}

function tryUseTool(toolId) {
  const stage = currentStage();
  if (!stage.next) return;

  if (toolId === stage.activeTool) {
    goNextStep(toolId);
    return;
  }

  showErrorFeedback();
}

function showErrorFeedback() {
  const stage = currentStage();
  const activeButton = document.querySelector(`.tool-button[data-tool="${stage.activeTool}"]`);
  [activeButton, els.bottomHint].forEach((element) => {
    if (!element) return;
    element.classList.remove("is-shaking");
    void element.offsetWidth;
    element.classList.add("is-shaking");
  });

  const originalHint = stage.hint;
  els.hintText.textContent = "请使用当前步骤对应的工具。";
  window.setTimeout(() => {
    if (currentStage().id === stage.id) {
      els.hintText.textContent = originalHint;
    }
  }, 1000);
}

function completeAndWear() {
  window.NuoState?.markComplete?.("completedCraft");
  window.location.href = "wear-mask.html";
}

els.workspace.addEventListener("click", () => {
  if (currentStage().id === "polished") {
    completeAndWear();
    return;
  }
  if (!state.selectedTool || state.isTransitioning) return;
  const selected = state.selectedTool;
  state.selectedTool = null;
  updateToolStates(currentStage());
  tryUseTool(selected);
});

els.workspace.addEventListener("keydown", (event) => {
  if ((event.key === "Enter" || event.key === " ") && state.selectedTool) {
    event.preventDefault();
    const selected = state.selectedTool;
    state.selectedTool = null;
    updateToolStates(currentStage());
    tryUseTool(selected);
  }
});

if (els.backButton) {
  els.backButton.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "choose-mask.html";
    }
  });
}

function initParticleBackground() {
  const container = document.getElementById("particle-bg");
  if (!container) return;

  const goldPalette = [
    [0.92, 0.68, 0.33],
    [1.0, 0.86, 0.58],
    [0.66, 0.43, 0.22],
    [0.72, 0.62, 0.46],
    [0.58, 0.27, 0.17]
  ];

  const pickColor = () => goldPalette[Math.floor(Math.random() * goldPalette.length)];
  const particleCount = () => {
    const width = window.innerWidth;
    if (width >= 1200) return 6000;
    if (width >= 768) return 3500;
    return 1800;
  };

  if (window.THREE) {
    initThreeParticles(container, pickColor, particleCount);
    initPointerSandTrail(container);
    return;
  }

  initCanvasParticles(container, pickColor, particleCount);
  initPointerSandTrail(container);
}

function initPointerSandTrail(container) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  canvas.className = "sand-trail-canvas";
  container.appendChild(canvas);

  const particles = [];
  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    px: window.innerWidth / 2,
    py: window.innerHeight / 2,
    active: false,
    lastMove: 0
  };

  let ratio = 1;
  let rafId = null;

  const resize = () => {
    ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.2 : 1.5);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const spawnTrail = (x, y, dx, dy) => {
    const speed = Math.min(34, Math.hypot(dx, dy));
    const amount = Math.min(20, Math.max(5, Math.floor(speed * 0.72)));
    const angle = Math.atan2(dy || 0.01, dx || 0.01);

    for (let i = 0; i < amount; i += 1) {
      const spread = (Math.random() - 0.5) * 1.35;
      const backflow = 0.8 + Math.random() * 2.4;
      const glow = Math.random() < 0.2;
      particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 12,
        vx: -Math.cos(angle) * backflow + Math.cos(angle + Math.PI / 2) * spread,
        vy: -Math.sin(angle) * backflow + Math.sin(angle + Math.PI / 2) * spread + 0.08,
        life: 1,
        decay: 0.014 + Math.random() * 0.018,
        size: glow ? 2.1 + Math.random() * 1.3 : 0.8 + Math.random() * 1.3,
        hue: glow ? "244, 210, 145" : Math.random() < 0.5 ? "216, 179, 106" : "184, 145, 79",
        phase: Math.random() * Math.PI * 2
      });
    }

    if (particles.length > 420) {
      particles.splice(0, particles.length - 420);
    }
  };

  const onPointerMove = (event) => {
    const now = performance.now();
    const x = event.clientX;
    const y = event.clientY;
    const dx = x - pointer.x;
    const dy = y - pointer.y;

    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    pointer.lastMove = now;

    if (Math.hypot(dx, dy) > 1.5) {
      spawnTrail(x, y, dx, dy);
    }
  };

  const animate = (time = 0) => {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.globalCompositeOperation = "lighter";

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const particle = particles[i];
      particle.life -= particle.decay;
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      particle.vx += Math.sin(time * 0.0012 + particle.phase) * 0.012;
      particle.vy += Math.cos(time * 0.0009 + particle.phase) * 0.008;
      particle.x += particle.vx;
      particle.y += particle.vy;

      const alpha = Math.max(0, particle.life) * 0.62;
      const radius = particle.size * (0.7 + (1 - particle.life) * 1.8);
      const gradient = context.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius * 4.2);
      gradient.addColorStop(0, `rgba(${particle.hue}, ${alpha})`);
      gradient.addColorStop(0.34, `rgba(${particle.hue}, ${alpha * 0.22})`);
      gradient.addColorStop(1, `rgba(${particle.hue}, 0)`);

      context.fillStyle = gradient;
      context.beginPath();
      context.arc(particle.x, particle.y, radius * 4.2, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = `rgba(${particle.hue}, ${alpha * 0.9})`;
      context.beginPath();
      context.arc(particle.x, particle.y, Math.max(0.45, radius), 0, Math.PI * 2);
      context.fill();
    }

    if (performance.now() - pointer.lastMove > 120) {
      pointer.active = false;
    }

    rafId = requestAnimationFrame(animate);
  };

  const start = () => {
    if (!rafId) rafId = requestAnimationFrame(animate);
  };

  const stop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  resize();
  start();
}

function initThreeParticles(container, pickColor, particleCount) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.z = 8.5;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.2 : 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  let rafId = null;
  let particles;
  let geometry;
  let positions;
  let seeds;
  let bounds;

  const makeParticle = (index) => {
    const band = Math.random();
    const diagonal = Math.random() * 2 - 1;
    const spread = Math.pow(Math.random(), 1.8);
    let x = (Math.random() * 16 - 8) * (0.72 + spread * 0.42);
    let y = Math.random() * 10 - 5;

    if (band < 0.58) {
      x = diagonal * 8;
      y = -diagonal * 2.8 + (Math.random() - 0.5) * (1.2 + spread * 2.4);
    } else if (band < 0.82) {
      x = diagonal * 6.6;
      y = diagonal * 2.2 + (Math.random() - 0.5) * (1 + spread * 2);
    }

    const centerQuiet = Math.hypot(x * 0.9, y * 1.25);
    if (centerQuiet < 1.9) {
      x += Math.sign(x || Math.random() - 0.5) * (1.4 + Math.random() * 1.4);
      y += Math.sign(y || Math.random() - 0.5) * (0.8 + Math.random() * 1.2);
    }

    positions[index * 3] = x;
    positions[index * 3 + 1] = y;
    positions[index * 3 + 2] = Math.random() * 4 - 2;
    seeds[index * 4] = Math.random() * Math.PI * 2;
    seeds[index * 4 + 1] = 0.0012 + Math.random() * 0.0024;
    seeds[index * 4 + 2] = Math.random() * 2 - 1;
    seeds[index * 4 + 3] = 0.65 + Math.random() * 1.3;
  };

  const buildParticles = () => {
    if (particles) {
      scene.remove(particles);
      geometry.dispose();
    }

    const count = particleCount();
    positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    seeds = new Float32Array(count * 4);
    bounds = { x: 9.5, y: 5.8, z: 2.6 };

    for (let i = 0; i < count; i += 1) {
      makeParticle(i);
      const color = pickColor();
      const dim = 0.8 + Math.random() * 0.72;
      colors[i * 3] = color[0] * dim;
      colors[i * 3 + 1] = color[1] * dim;
      colors[i * 3 + 2] = color[2] * dim;
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: window.innerWidth < 768 ? 0.02 : 0.026,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
  };

  const animate = (time = 0) => {
    const t = time * 0.00012;
    for (let i = 0; i < seeds.length / 4; i += 1) {
      const offset = i * 3;
      const phase = seeds[i * 4];
      const speed = seeds[i * 4 + 1];
      const swirl = seeds[i * 4 + 2];
      const depth = seeds[i * 4 + 3];

      const x = positions[offset];
      const y = positions[offset + 1];
      const centerPull = Math.max(0.2, 1.2 - Math.hypot(x * 0.08, y * 0.12));

      positions[offset] +=
        -speed * 1.85 +
        Math.sin(t + y * 0.62 + phase) * 0.0021 * depth +
        -y * 0.00008 * swirl * centerPull;
      positions[offset + 1] +=
        speed * 0.42 +
        Math.cos(t + x * 0.46 + phase) * 0.0014 * depth +
        x * 0.00006 * swirl * centerPull;
      positions[offset + 2] += Math.sin(t + phase + i * 0.01) * 0.00045;

      if (positions[offset] < -bounds.x || positions[offset + 1] > bounds.y || Math.abs(positions[offset + 2]) > bounds.z) {
        positions[offset] = bounds.x + Math.random() * 1.2;
        positions[offset + 1] = Math.random() * bounds.y * 2 - bounds.y;
        positions[offset + 2] = Math.random() * 4 - 2;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    particles.rotation.z = Math.sin(t * 0.42) * 0.018;
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(animate);
  };

  const start = () => {
    if (!rafId) rafId = requestAnimationFrame(animate);
  };

  const stop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.2 : 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    buildParticles();
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("resize", onResize);

  buildParticles();
  start();
}

function initCanvasParticles(container, pickColor, particleCount) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;
  container.appendChild(canvas);

  let particles = [];
  let rafId = null;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.2 : 1.5);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: particleCount() }, () => {
      const color = pickColor();
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: -0.08 - Math.random() * 0.16,
        vy: 0.015 + Math.random() * 0.07,
        size: 0.9 + Math.random() * 1.75,
        alpha: 0.34 + Math.random() * 0.46,
        phase: Math.random() * Math.PI * 2,
        color: `rgba(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}, `
      };
    });
  };

  const animate = (time = 0) => {
    const t = time * 0.00012;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    context.globalCompositeOperation = "lighter";

    for (const particle of particles) {
      particle.x += particle.vx + Math.sin(t + particle.y * 0.01 + particle.phase) * 0.16;
      particle.y += particle.vy + Math.cos(t + particle.x * 0.008 + particle.phase) * 0.08;

      if (particle.x < -12 || particle.y > window.innerHeight + 12) {
        particle.x = window.innerWidth + Math.random() * 60;
        particle.y = Math.random() * window.innerHeight;
      }

      context.fillStyle = `${particle.color}${particle.alpha})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }

    rafId = requestAnimationFrame(animate);
  };

  const start = () => {
    if (!rafId) rafId = requestAnimationFrame(animate);
  };

  const stop = () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener("resize", resize);

  resize();
  start();
}

initCraftNav();
initParticleBackground();
renderTools();
updateText(currentStage(), false);
els.workspaceImage.onerror = () => {
  if (!isKaishanDemoMask) {
    // Missing craft-process images fall back to the selected mask front image.
    els.workspaceImage.onerror = null;
    els.workspaceImage.src = `../${selectedMask.image}`;
  }
};
els.workspaceImage.src = currentStage().workspaceImage;
els.workspaceImage.dataset.stage = currentStage().id;
els.workspaceImage.dataset.figmaFrame = currentStage().figmaFrame;
