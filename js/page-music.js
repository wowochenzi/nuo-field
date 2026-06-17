import * as THREE from "three";

(function () {
  const stage = document.getElementById("musicInstrumentGrid");
  const nowSymbol = document.getElementById("musicNowSymbol");
  const nowTitle = document.getElementById("musicNowTitle");
  const playedCount = document.getElementById("musicPlayedCount");
  const next = document.getElementById("enterSummary");
  const played = new Set();
  let isEndingTransitioning = false;
  const DEMO_INSTRUMENT_SCALE = 3.5;
  const INSTRUMENT_SIZE_MULTIPLIER = 1.8;
  const INSTRUMENT_PARTICLE_SCALE = DEMO_INSTRUMENT_SCALE * INSTRUMENT_SIZE_MULTIPLIER;

  if (!stage) return;

  const visualMap = {
    gu: { image: "assets/images/music/drum.png", prompt: "沉声开场" },
    luo: { image: "assets/images/music/gong.png", prompt: "金声铺场" },
    suona: { image: "assets/images/music/suona.png", prompt: "高声引场" },
    bo: { image: "assets/images/music/cymbals.png", prompt: "裂声收束" }
  };

  const instrumentConfigs = window.NuoData.music.map((item) => ({
    id: item.id,
    name: item.name,
    symbol: item.symbol,
    freq: item.freq,
    img: NuoRouter.asset(visualMap[item.id]?.image || "assets/images/music/fallback.png"),
    sounds: [
      NuoRouter.asset(`assets/audio/${item.id}.mp3`),
      NuoRouter.asset(`assets/audio/music/${item.id}.mp3`)
    ],
    prompt: visualMap[item.id]?.prompt || "傩音被点亮"
  }));
  const activeInstrumentAudios = new Set();

  stage.classList.add("music-particle-stage");
  stage.innerHTML = `
    <div class="music-particle-loading" id="musicParticleLoading">正在凝聚等分阵列粒子...</div>
    <div class="music-canvas-container" id="musicCanvasContainer" aria-label="点击粒子乐器聆听傩音"></div>
    <div class="music-instrument-labels" id="musicInstrumentLabels" aria-label="乐器名称"></div>
  `;

  const container = document.getElementById("musicCanvasContainer");
  const loading = document.getElementById("musicParticleLoading");
  const labels = document.getElementById("musicInstrumentLabels");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 10);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    premultipliedAlpha: false,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.appendChild(renderer.domElement);

  const textureLoader = new THREE.TextureLoader();
  const instances = [];
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const clock = new THREE.Clock();
  let loadedCount = 0;
  let animationFrame = 0;

  function resizeStage() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    if (loadedCount === instrumentConfigs.length) updateLayout();
  }

  function getFourLayoutPositions() {
    const depth = camera.position.z;
    const vFOV = (camera.fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * depth;
    const visibleWidth = visibleHeight * camera.aspect;

    return [
      -0.375 * visibleWidth,
      -0.125 * visibleWidth,
      0.125 * visibleWidth,
      0.375 * visibleWidth
    ];
  }

  function updateLayout() {
    const offsetsX = getFourLayoutPositions();
    instances.forEach((inst, index) => {
      if (!inst) return;
      inst.points.position.x = offsetsX[index];
      inst.glowPoints.position.x = offsetsX[index];
      inst.hitPlane.position.x = offsetsX[index];
    });
  }

  function createParticleInstrument(config, index, texture) {
    const image = texture.image;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const vertices = [];
    const colors = [];
    const imgW = canvas.width;
    const imgH = canvas.height;
    const maxDim = Math.max(imgW, imgH);
    const scale = INSTRUMENT_PARTICLE_SCALE / maxDim;
    const step = Math.max(1, Math.round(maxDim / 250));

    for (let y = 0; y < imgH; y += step) {
      for (let x = 0; x < imgW; x += step) {
        const i = (y * imgW + x) * 4;
        const alpha = imgData.data[i + 3];

        if (alpha > 80) {
          const targetX = (x - imgW / 2) * scale;
          const targetY = -(y - imgH / 2) * scale;
          const targetZ = (Math.random() - 0.5) * 0.15;
          vertices.push(targetX, targetY, targetZ);
          colors.push(imgData.data[i] / 255, imgData.data[i + 1] / 255, imgData.data[i + 2] / 255);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPulse;
        attribute vec3 aColor;
        varying vec3 vColor;

        void main() {
          vColor = aColor;
          vec3 pos = position;

          pos.z += sin(pos.x * 2.0 + uTime * 2.0) * 0.03;
          pos.y += cos(pos.x * 1.5 + uTime * 1.5) * 0.03;
          pos += normalize(pos) * uPulse * 0.3;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pSize = 3.0 + (uPulse * 4.0);
          gl_PointSize = pSize * (4.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uPulse;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;

          float alpha = exp(-r * 3.5);
          vec3 finalColor = vColor * (2.5 + uPulse * 3.0);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.renderOrder = 2;

    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPulse: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uPulse;
        attribute vec3 aColor;
        varying vec3 vColor;

        void main() {
          vColor = aColor;
          vec3 pos = position;

          pos.z += sin(pos.x * 2.0 + uTime * 2.0) * 0.03;
          pos.y += cos(pos.x * 1.5 + uTime * 1.5) * 0.03;
          pos += normalize(pos) * uPulse * 0.3;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pSize = 11.0 + (uPulse * 11.0);
          gl_PointSize = pSize * (4.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uPulse;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;

          float alpha = exp(-r * 1.00) * (0.40 + uPulse * 0.20);
          vec3 finalColor = vColor * (3.4 + uPulse * 4.0);
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const glowPoints = new THREE.Points(geometry, glowMaterial);
    glowPoints.renderOrder = 1;
    scene.add(glowPoints);
    scene.add(points);

    const planeGeo = new THREE.PlaneGeometry(imgW * scale, imgH * scale);
    const planeMat = new THREE.MeshBasicMaterial({ visible: false });
    const hitPlane = new THREE.Mesh(planeGeo, planeMat);
    scene.add(hitPlane);

    instances[index] = {
      id: config.id,
      config,
      points,
      glowPoints,
      material,
      glowMaterial,
      hitPlane,
      pulse: 0
    };
  }

  function playInstrumentAudio(config, sourceIndex = 0) {
    const source = config.sounds[sourceIndex];
    if (!source) return;

    const audio = new Audio(source);
    audio.preload = "auto";
    audio.volume = 1;

    activeInstrumentAudios.add(audio);
    audio.addEventListener("ended", () => activeInstrumentAudios.delete(audio), { once: true });
    audio.addEventListener("error", () => {
      activeInstrumentAudios.delete(audio);
      playInstrumentAudio(config, sourceIndex + 1);
    }, { once: true });

    audio.play().catch(() => {
      activeInstrumentAudios.delete(audio);
      playInstrumentAudio(config, sourceIndex + 1);
    });
  }

  function markInstrumentPlayed(instance) {
    const { config } = instance;
    played.add(config.id);
    nowSymbol.textContent = config.symbol;
    nowTitle.textContent = `${config.name}已入场：${config.prompt}`;
    playedCount.textContent = String(played.size);
    stage.dataset.activeInstrument = config.id;
    labels?.querySelectorAll(".music-particle-label").forEach((label) => {
      label.classList.toggle("is-active", label.dataset.id === config.id);
    });

    instance.pulse = 1;
    playInstrumentAudio(config);

    if (played.size >= instrumentConfigs.length) {
      NuoState.markComplete("completedMusic");
      next.classList.remove("is-disabled");
      next.removeAttribute("aria-disabled");
    }
  }

  function handleStageClick(event) {
    if (loadedCount < instrumentConfigs.length) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const validPlanes = instances.filter(Boolean).map((inst) => inst.hitPlane);
    const intersects = raycaster.intersectObjects(validPlanes);

    if (!intersects.length) return;
    const hitMesh = intersects[0].object;
    const target = instances.find((inst) => inst && inst.hitPlane === hitMesh);
    if (target) markInstrumentPlayed(target);
  }

  function animate() {
    animationFrame = requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    instances.forEach((inst) => {
      if (!inst) return;

      if (inst.pulse > 0.001) {
        inst.pulse += (0 - inst.pulse) * 0.12;
      } else {
        inst.pulse = 0;
      }

      inst.material.uniforms.uTime.value = elapsedTime;
      inst.material.uniforms.uPulse.value = inst.pulse;
      inst.glowMaterial.uniforms.uTime.value = elapsedTime;
      inst.glowMaterial.uniforms.uPulse.value = inst.pulse;

      const rotY = Math.sin(elapsedTime * 0.4) * 0.08;
      inst.points.rotation.y = rotY;
      inst.glowPoints.rotation.y = rotY;
      inst.hitPlane.rotation.y = rotY;
    });

    renderer.clear(true, true, true);
    renderer.render(scene, camera);
  }

  instrumentConfigs.forEach((config, index) => {
    textureLoader.load(
      config.img,
      (texture) => {
        createParticleInstrument(config, index, texture);
        loadedCount += 1;
        if (loadedCount === instrumentConfigs.length) {
          resizeStage();
          loading.hidden = true;
        }
      },
      undefined,
      () => {
        loading.textContent = `${config.name}粒子加载失败，请检查素材路径`;
      }
    );
  });

  instrumentConfigs.forEach((config) => {
    const label = document.createElement("button");
    label.type = "button";
    label.className = "music-particle-label";
    label.dataset.id = config.id;
    label.innerHTML = `
      <span class="music-particle-name">${config.name}</span>
      <span class="music-particle-divider" aria-hidden="true"></span>
      <span class="music-particle-call">点击聆听</span>
    `;
    label.addEventListener("click", () => {
      const target = instances.find((inst) => inst?.id === config.id);
      if (target) markInstrumentPlayed(target);
    });
    labels.appendChild(label);
  });

  next.setAttribute("aria-disabled", "true");
  next.addEventListener("click", () => {
    if (next.classList.contains("is-disabled") || isEndingTransitioning) return;
    isEndingTransitioning = true;
    next.setAttribute("aria-disabled", "true");

    const overlay = document.createElement("div");
    overlay.className = "music-eye-transition";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);

    window.requestAnimationFrame(() => {
      overlay.classList.add("is-closed");
      window.setTimeout(() => {
        sessionStorage.setItem("nuoEndingAutoOpen", "1");
        NuoRouter.go("pages/summary.html");
      }, 660);
    });
  });

  container.addEventListener("click", handleStageClick);
  window.addEventListener("resize", resizeStage);
  resizeStage();
  animate();

  window.addEventListener("pagehide", () => {
    cancelAnimationFrame(animationFrame);
    renderer.dispose();
  });
})();
