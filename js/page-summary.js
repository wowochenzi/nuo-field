(function () {
  const body = document.body;
  const eyeOverlay = document.getElementById("endingEyeOverlay");
  const eyeHint = document.getElementById("endingEyeHint");
  const canvasContainer = document.getElementById("endingCanvasContainer");
  const scrollHint = document.querySelector(".ending-scroll-hint");
  const asset = (path) => NuoRouter.asset(`assets/ending/${path}`);

  let eyeStep = "intro-closed";
  let tailStarted = false;
  let finalShown = false;

  function setPhase(phase) {
    body.dataset.endingPhase = phase;
    eyeStep = phase;
  }

  function handleEyeClick() {
    if (eyeStep === "intro-closed") {
      setPhase("intro-open");
      eyeHint.textContent = "再次点击闭眼";
      return;
    }

    if (eyeStep === "intro-open") {
      setPhase("intro-exit");
      eyeHint.textContent = "";
      window.setTimeout(() => {
        if (eyeStep !== "intro-exit") return;
        setPhase("tail-closed");
        eyeHint.textContent = "点击睁眼";
      }, 760);
      return;
    }

    if (eyeStep === "tail-closed") {
      setPhase("tail-open");
      eyeHint.textContent = "";
      startTailScene();
    }
  }

  eyeOverlay.addEventListener("click", handleEyeClick);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      if (["intro-closed", "intro-open", "tail-closed"].includes(eyeStep)) {
        event.preventDefault();
        handleEyeClick();
      }
    }
  });

  if (sessionStorage.getItem("nuoEndingAutoOpen") === "1") {
    sessionStorage.removeItem("nuoEndingAutoOpen");
    window.setTimeout(() => {
      if (eyeStep === "intro-closed") handleEyeClick();
    }, 180);
  }

  async function startTailScene() {
    if (tailStarted) return;
    tailStarted = true;

    try {
      const THREE = await import("three");
      const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
      const { EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js");
      const { RenderPass } = await import("three/addons/postprocessing/RenderPass.js");
      initTailScene({ THREE, UnrealBloomPass, EffectComposer, RenderPass });
    } catch (error) {
      console.error("Ending particle scene failed to load.", error);
      scrollHint.textContent = "点击进入闭幕";
      scrollHint.style.pointerEvents = "auto";
      scrollHint.addEventListener("click", showFinalEnding, { once: true });
    }
  }

  function showFinalEnding() {
    if (finalShown) return;
    finalShown = true;
    setPhase("final");
  }

  function initTailScene({ THREE, UnrealBloomPass, EffectComposer, RenderPass }) {
    const VISUAL_CONFIG = {
      MAX_PARTICLES_PER_LAYER: 100000,
      topologyDepth: 80.0,
      particleBaseSize: 5.0,
      particleGlow: 1.8,
      bloomStrength: 1.6,
      bloomRadius: 0.5,
      bloomThreshold: 0.1,
      fogColor: 0x050101,
      fogDensity: 0.0015,
      sandflowCount: 30000
    };

    const LAYER_CONFIG = {
      layers: [
        { id: "fig_1", x: -120, y: -20, z: -400, src: asset("figures/nuo_figure_01.png"), scale: 400, fallbackText: "方相神" },
        { id: "mask_1", x: 220, y: 30, z: -800, src: asset("particles/mask_01.png"), scale: 800, fallbackText: "神面 一" },
        { id: "cloud_1", x: -100, y: 80, z: -1200, src: asset("symbols/cloud_pattern.png"), scale: 500, isCloud: true, fallbackText: "祥云诡雾" },
        { id: "mask_2", x: -70, y: -40, z: -1600, src: asset("particles/mask_02.png"), scale: 700, fallbackText: "神面 二" },
        { id: "fig_2", x: -150, y: 40, z: -2000, src: asset("figures/nuo_figure_02.png"), scale: 450, fallbackText: "开山神" },
        { id: "mask_3", x: -80, y: -80, z: -2400, src: asset("particles/mask_03.png"), scale: 600, fallbackText: "神面 三" },
        { id: "cloud_2", x: 150, y: 20, z: -2800, src: asset("symbols/cloud_pattern.png"), scale: 550, isCloud: true, fallbackText: "祭祀法器" },
        { id: "fig_3", x: 160, y: 40, z: -3200, src: asset("figures/nuo_figure_03.png"), scale: 480, fallbackText: "五猖神" },
        { id: "mask_4", x: -100, y: -40, z: -3600, src: asset("particles/mask_04.png"), scale: 780, fallbackText: "神面 四" },
        { id: "mask_5", x: 150, y: -80, z: -4000, src: asset("particles/mask_05.png"), scale: 600, fallbackText: "神面 五" },
        { id: "fig_4", x: -180, y: 120, z: -4400, src: asset("figures/nuo_figure_04.png"), scale: 460, fallbackText: "雷公" },
        { id: "cloud_3", x: -150, y: -100, z: -4800, src: asset("symbols/cloud_pattern.png"), scale: 550, isCloud: true, fallbackText: "飞流云" },
        { id: "mask_6", x: -80, y: 60, z: -5200, src: asset("particles/mask_06.png"), scale: 700, fallbackText: "神面 六" },
        { id: "mask_7", x: 120, y: -20, z: -5600, src: asset("particles/mask_07.png"), scale: 600, fallbackText: "神面 七" },
        { id: "fig_5", x: 40, y: 150, z: -6000, src: asset("figures/nuo_figure_05.png"), scale: 500, fallbackText: "判官" },
        { id: "mask_8", x: -100, y: -120, z: -6400, src: asset("particles/mask_08.png"), scale: 550, fallbackText: "神面 八" },
        { id: "cloud_4", x: 180, y: 60, z: -6800, src: asset("symbols/cloud_pattern.png"), scale: 650, isCloud: true, fallbackText: "终章结界" }
      ]
    };

    const cameraPath = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 1500),
      new THREE.Vector3(0, 0, 150),
      new THREE.Vector3(20, 0, -600),
      new THREE.Vector3(-20, 10, -1800),
      new THREE.Vector3(30, -10, -3000),
      new THREE.Vector3(-35, 15, -4200),
      new THREE.Vector3(25, -5, -5400),
      new THREE.Vector3(0, 30, -6600)
    ]);

    let scene;
    let camera;
    let renderer;
    let composer;
    let clock;
    let sandFlowParticles;
    let scrollProgress = 0;
    let targetScrollProgress = 0;
    const MAX_SCROLL = 8500;
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let touchStartY = null;
    const layerMaterials = [];

    init();
    animate();

    function init() {
      clock = new THREE.Clock();
      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(VISUAL_CONFIG.fogColor, VISUAL_CONFIG.fogDensity);

      camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1.0, 10000);
      camera.position.copy(cameraPath.getPointAt(1));

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.sortObjects = false;
      renderer.setClearColor(0x000000, 0);
      canvasContainer.appendChild(renderer.domElement);

      const renderScene = new RenderPass(scene, camera);
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        VISUAL_CONFIG.bloomStrength,
        VISUAL_CONFIG.bloomRadius,
        VISUAL_CONFIG.bloomThreshold
      );

      composer = new EffectComposer(renderer);
      composer.addPass(renderScene);
      composer.addPass(bloomPass);

      createSandFlows();
      LAYER_CONFIG.layers.forEach((layer) => createParticleLayer(layer));

      window.addEventListener("resize", onWindowResize);
      window.addEventListener("wheel", onMouseWheel, { passive: false });
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
    }

    function createParticleLayer(layerConfig) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          processImageData(img, layerConfig);
        } catch (error) {
          triggerFallback(layerConfig);
        }
      };
      img.onerror = () => triggerFallback(layerConfig);
      img.src = layerConfig.src;
    }

    function triggerFallback(layerConfig) {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 140px 'Microsoft YaHei'";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(layerConfig.fallbackText, canvas.width / 2, canvas.height / 2);

      processImageData(canvas, layerConfig, true);
    }

    function processImageData(imageSource, layerConfig, isFallback = false) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const pTarget = 150000;
      const imgAspect = imageSource.width / imageSource.height;
      canvas.width = Math.floor(Math.sqrt(pTarget * imgAspect));
      canvas.height = Math.floor(canvas.width / imgAspect);

      if (canvas.width <= 0 || canvas.height <= 0) return;

      ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const targetLocalPos = [];
      const randomLocalPos = [];
      const colors = [];
      const randData = [];

      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const index = (y * canvas.width + x) * 4;
          if (imgData[index + 3] > 120) {
            const r = imgData[index] / 255;
            const g = imgData[index + 1] / 255;
            const b = imgData[index + 2] / 255;
            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
            const jitterX = (Math.random() - 0.5) * layerConfig.scale * 0.015;
            const jitterY = (Math.random() - 0.5) * layerConfig.scale * 0.015;
            const localX = (x / canvas.width - 0.5) * layerConfig.scale + jitterX;
            const localY = -(y / canvas.height - 0.5) * (canvas.height / canvas.width) * layerConfig.scale + jitterY;
            const topologyZ = luminance * VISUAL_CONFIG.topologyDepth;
            const localZ = topologyZ + (Math.random() - 0.5) * 8.0;

            targetLocalPos.push(localX, localY, localZ);
            randomLocalPos.push(
              localX + (Math.random() - 0.5) * layerConfig.scale * 4.0,
              localY + (Math.random() - 0.5) * layerConfig.scale * 4.0,
              localZ + (Math.random() - 0.5) * 1000.0
            );

            const randomSizeMultiplier = 0.2 + Math.pow(Math.random(), 2.0) * 2.5;
            const randomShimmerSeed = Math.random();
            randData.push(randomSizeMultiplier, randomShimmerSeed);

            if (isFallback) {
              colors.push(0.9, 0.8 * Math.random() + 0.2, 0.1);
            } else {
              colors.push(Math.min(1.0, r * 1.3), Math.min(1.0, g * 1.1), Math.min(1.0, b * 0.9));
            }
          }
        }
      }

      if (targetLocalPos.length <= 0) return;

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("targetLocalPos", new THREE.Float32BufferAttribute(targetLocalPos, 3));
      geometry.setAttribute("randomLocalPos", new THREE.Float32BufferAttribute(randomLocalPos, 3));
      geometry.setAttribute("customColor", new THREE.Float32BufferAttribute(colors, 3));
      geometry.setAttribute("randData", new THREE.Float32BufferAttribute(randData, 2));
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(targetLocalPos.length).fill(0), 3));

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCameraZ: { value: camera.position.z },
          uLayerZ: { value: layerConfig.z },
          uCenterPos: { value: new THREE.Vector3(layerConfig.x, layerConfig.y, layerConfig.z) },
          uBaseSize: { value: VISUAL_CONFIG.particleBaseSize },
          uGlowFactor: { value: VISUAL_CONFIG.particleGlow },
          uIsCloud: { value: layerConfig.isCloud ? 1.0 : 0.0 }
        },
        vertexShader: `
          uniform float uTime;
          uniform float uCameraZ;
          uniform float uLayerZ;
          uniform vec3 uCenterPos;
          uniform float uBaseSize;
          uniform float uIsCloud;

          attribute vec3 targetLocalPos;
          attribute vec3 randomLocalPos;
          attribute vec3 customColor;
          attribute vec2 randData;

          varying vec3 vColor;
          varying float vAlpha;
          varying float vShimmerSeed;

          ${document.getElementById("noise-glsl").textContent}

          void main() {
            vColor = customColor;
            vShimmerSeed = randData.y;

            float distance = uCameraZ - uLayerZ;
            float progress = 1.0;

            if (distance > 1200.0) {
              progress = 1.0;
            } else if (distance > 800.0) {
              progress = smoothstep(800.0, 1200.0, distance);
            } else if (distance > 40.0) {
              progress = 0.0;
            } else {
              progress = smoothstep(40.0, -150.0, distance);
            }

            vec3 finalLocalPos = mix(targetLocalPos, randomLocalPos, progress);

            if (uIsCloud > 0.5) {
              finalLocalPos.x += sin(uTime * 0.2 + uLayerZ) * 45.0 * (1.0 - progress);
              finalLocalPos.y += cos(uTime * 0.15 + uLayerZ) * 30.0 * (1.0 - progress);

              float cloudNoise = snoise(vec3(targetLocalPos.x * 0.008, targetLocalPos.y * 0.008, uTime * 0.2)) * 40.0;
              finalLocalPos.x += cloudNoise * (1.0 - progress);
              finalLocalPos.y += cloudNoise * (1.0 - progress);

              float dir = sign(sin(uLayerZ * 12.34));
              finalLocalPos.x += (400.0 - distance) * dir * 1.5;
            } else {
              float breathFreq = 0.015;
              float breathSpeed = 1.0;
              finalLocalPos.z += sin(targetLocalPos.x * breathFreq + uTime * breathSpeed) * 2.0 * (1.0 - progress);
            }

            vec3 finalWorldPos = finalLocalPos + uCenterPos;
            vec4 mvPosition = modelViewMatrix * vec4(finalWorldPos, 1.0);

            float size = uBaseSize * randData.x * (1.0 + progress * 1.5);
            float depth = max(0.1, -mvPosition.z);
            gl_PointSize = clamp((size * 100.0) / depth, 1.0, 150.0);

            gl_Position = projectionMatrix * mvPosition;

            vAlpha = smoothstep(-100.0, 40.0, distance) * (1.0 - smoothstep(900.0, 1400.0, distance));
            if (uIsCloud > 0.5) vAlpha *= 0.35;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform float uGlowFactor;

          varying vec3 vColor;
          varying float vAlpha;
          varying float vShimmerSeed;

          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;

            float core = 1.0 - smoothstep(0.0, 0.2, r);
            float corona = exp(-r * 3.0);
            float particleAlpha = core * 0.7 + corona * 0.6;

            float shimmer = 1.0 + sin(uTime * 4.0 + vShimmerSeed * 50.0) * 0.3;
            vec3 finalColor = vColor * uGlowFactor * shimmer;
            gl_FragColor = vec4(finalColor, vAlpha * particleAlpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const particles = new THREE.Points(geometry, material);
      particles.frustumCulled = false;
      scene.add(particles);
      layerMaterials.push(material);
    }

    function createSandFlows() {
      const geo = new THREE.BufferGeometry();
      const count = VISUAL_CONFIG.sandflowCount;
      const positions = new Float32Array(count * 3);
      const seeds = new Float32Array(count);

      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (Math.random() - 0.5) * 1500;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1500;
        positions[i * 3 + 2] = Math.random() * -8000 + 200;
        seeds[i] = Math.random();
      }

      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("randSeed", new THREE.BufferAttribute(seeds, 1));

      const mat = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uBaseSize: { value: 4.5 } },
        vertexShader: `
          uniform float uTime; uniform float uBaseSize; attribute float randSeed;
          varying vec3 vColor; varying float vAlpha; varying float vRand;
          ${document.getElementById("noise-glsl").textContent}
          void main() {
            vRand = randSeed;
            vec3 noisePos = position + vec3(uTime * (0.2 + randSeed * 0.2));
            vec3 finalPos = position;
            float noiseVal = snoise(noisePos * 0.001);
            finalPos.x += noiseVal * 20.0;
            finalPos.y += sin(noisePos.z * 0.002) * noiseVal * 20.0;
            finalPos.z += uTime * (3.0 + randSeed * 3.0);
            finalPos.z = mod(finalPos.z + 8000.0, 8000.0) - 7800.0;

            float colorChoice = mod(randSeed * 100.0, 3.0);
            if(colorChoice < 1.0) vColor = vec3(0.8, 0.5, 0.2);
            else if (colorChoice < 2.0) vColor = vec3(0.6, 0.1, 0.05);
            else vColor = vec3(0.4, 0.3, 0.2);

            vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
            float depth = max(0.1, -mvPosition.z);
            gl_PointSize = clamp((uBaseSize * (1.0 + noiseVal * 0.5) * 100.0) / depth, 1.0, 40.0);

            gl_Position = projectionMatrix * mvPosition;
            vAlpha = smoothstep(-7800.0, -7400.0, finalPos.z) * (1.0 - smoothstep(100.0, 200.0, finalPos.z));
          }
        `,
        fragmentShader: `
          uniform float uTime; varying vec3 vColor; varying float vAlpha; varying float vRand;
          void main() {
            vec2 cxy = 2.0 * gl_PointCoord - 1.0;
            float r = dot(cxy, cxy);
            if (r > 1.0) discard;
            float particleAlpha = exp(-r * 3.0);
            float shimmer = 1.0 + sin(uTime * 6.0 + vRand * 100.0) * 0.3;
            gl_FragColor = vec4(vColor * shimmer, vAlpha * particleAlpha * 0.3);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      sandFlowParticles = new THREE.Points(geo, mat);
      sandFlowParticles.frustumCulled = false;
      scene.add(sandFlowParticles);
    }

    function advanceScroll(deltaY) {
      const dy = Math.max(-50, Math.min(50, deltaY));
      targetScrollProgress += dy * 0.8;
      targetScrollProgress = Math.max(0, Math.min(targetScrollProgress, MAX_SCROLL));
    }

    function onMouseWheel(event) {
      if (body.dataset.endingPhase !== "tail-open") return;
      event.preventDefault();
      advanceScroll(event.deltaY);
    }

    function onMouseMove(event) {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    function onTouchStart(event) {
      touchStartY = event.touches[0]?.clientY ?? null;
    }

    function onTouchMove(event) {
      if (body.dataset.endingPhase !== "tail-open" || touchStartY === null) return;
      const nextY = event.touches[0]?.clientY ?? touchStartY;
      event.preventDefault();
      advanceScroll(touchStartY - nextY);
      touchStartY = nextY;
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      scrollProgress += (targetScrollProgress - scrollProgress) * 0.04;
      const outroProgress = Math.max(0, Math.min(1, scrollProgress / MAX_SCROLL));
      const timelineProgress = 1.0 - outroProgress;
      const camPos = cameraPath.getPointAt(timelineProgress);
      const lookAtPos = camPos.clone().add(cameraPath.getTangentAt(timelineProgress));

      camera.position.copy(camPos);
      camera.lookAt(lookAtPos);

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      camera.position.x += mouseX * 25;
      camera.position.y += mouseY * 25;

      layerMaterials.forEach((mat) => {
        if (mat.uniforms.uTime) mat.uniforms.uTime.value = time;
        if (mat.uniforms.uCameraZ) mat.uniforms.uCameraZ.value = camera.position.z;
      });

      if (sandFlowParticles) {
        sandFlowParticles.material.uniforms.uTime.value = time;
      }

      if (!finalShown && targetScrollProgress >= MAX_SCROLL && scrollProgress >= MAX_SCROLL * 0.985) {
        showFinalEnding();
      }

      composer.render();
    }
  }
})();
