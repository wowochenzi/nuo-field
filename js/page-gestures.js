(function () {
  const mask = NuoState.getSelectedMask();
  const gestures = [
    {
      id: "zushijue",
      name: "祖师诀",
      info: "左掌心向上，中指竖直与掌心成直角，把食指与无名指卷曲附靠在中指下部一节处，小指曲向掌心，大拇指尖曲附于中指上部第一节。",
      hint: "../assets/images/gestures/zushijue-hint.png",
      lit: "../assets/images/gestures/zushijue-lit.png"
    },
    {
      id: "dujiaojianjunjue",
      name: "独角将军诀",
      info: "左掌心向上，中指竖直与掌心成直角，将食指背附于中指背，无名指曲附在食指背上，小指曲附于无名指背的第二节，再用大指尖顶附中指二节。",
      hint: "../assets/images/gestures/dujiaojianjunjue-hint.png",
      lit: "../assets/images/gestures/dujiaojianjunjue-lit.png"
    },
    {
      id: "wuchangjue",
      name: "五猖诀",
      info: "将左大拇指、中指与无名指的三指尖互相靠拢搭成拱形状，然后食指与小指伸直，掌心向下。",
      hint: "../assets/images/gestures/wuchangjue-hint.png",
      lit: "../assets/images/gestures/wuchangjue-lit.png"
    }
  ];

  const els = {
    stage: document.getElementById("gestureStage"),
    video: document.getElementById("gestureVideo"),
    threeCanvas: document.getElementById("gestureThreeCanvas"),
    handCanvas: document.getElementById("gestureHandCanvas"),
    currentCard: document.getElementById("gestureCurrentCard"),
    currentName: document.getElementById("gestureCurrentName"),
    hintImage: document.getElementById("gestureHintImage"),
    info: document.getElementById("gestureInfoText"),
    lightList: document.getElementById("gestureLightList"),
    leftStack: document.querySelector(".gesture-left-stack"),
    cameraButton: document.getElementById("gestureCameraButton"),
    startCue: document.getElementById("gestureStartCue"),
    seal: document.getElementById("gestureCompleteSeal"),
    next: document.getElementById("enterInstruments")
  };

  const fit = {
    maskToFaceWidth: 1.2,
    yOffsetByFace: 0.35,
    minScale: 0.75,
    maxScale: 8,
    fallbackScale: 2.9,
    positionEase: 0.4,
    scaleEase: 0.3,
    rotationEase: 0.3,
    distanceResponse: 1.1,
    distanceMinMultiplier: 0.88,
    distanceMaxMultiplier: 1.6
  };

  const handConnections = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [0, 9], [9, 10], [10, 11], [11, 12],
    [0, 13], [13, 14], [14, 15], [15, 16],
    [0, 17], [17, 18], [18, 19], [19, 20],
    [5, 9], [9, 13], [13, 17]
  ];

  NuoState.set("completedGestureIds", []);
  NuoState.set("completedGestures", false);

  const completed = new Set();
  let currentIndex = Math.min(completed.size, gestures.length - 1);
  let pendingId = null;
  let pendingTimer = null;
  let pendingStartedAt = 0;
  let stream = null;
  let faceMesh = null;
  let hands = null;
  let tracking = false;
  let introReady = false;
  let lastVideoTime = -1;
  let handCtx = null;
  let three = null;
  let modelLoaded = false;
  let cameraStarting = false;

  function getCurrentGesture() {
    return gestures[currentIndex] || gestures[gestures.length - 1];
  }

  function setStatus(text) {
    els.cameraButton.textContent = text;
  }

  function playGestureTone(done = false) {
    if (!window.NuoAudio?.playTone) return;
    const base = done ? 390 : 260;
    NuoAudio.playTone(base + completed.size * 34, done ? 0.28 : 0.14, done ? "sine" : "triangle");
  }

  function render() {
    const current = getCurrentGesture();
    const isComplete = completed.size === gestures.length;

    els.currentName.textContent = isComplete ? "已成" : current.name;
    els.info.textContent = isComplete ? "三诀已依次点亮，掌间傩势已成。" : current.info;
    els.hintImage.src = current.hint;
    els.hintImage.alt = `${current.name}手诀提示`;
    els.hintImage.onerror = () => {
      els.hintImage.onerror = null;
      els.hintImage.src = "../assets/images/gestures/zushijue-hint.png";
    };

    els.lightList.innerHTML = gestures.map((gesture) => {
      const isLit = completed.has(gesture.id);
      const isCurrent = !isComplete && gesture.id === current.id;
      const isPending = pendingId === gesture.id;
      return `
        <article class="gesture-light-card ${isLit ? "is-lit" : ""} ${isCurrent ? "is-current" : ""} ${isPending ? "is-pending" : ""}" data-id="${gesture.id}">
          <span>${gesture.name}</span>
          <img src="${gesture.lit}" alt="${gesture.name}点亮图" />
          <i aria-hidden="true"></i>
        </article>
      `;
    }).join("");

    els.seal.hidden = !isComplete;
    els.seal.classList.toggle("is-visible", isComplete);
    els.leftStack?.classList.toggle("is-complete", isComplete);
    els.next.disabled = !isComplete;
    els.next.classList.toggle("is-disabled", !isComplete);
    els.next.classList.toggle("is-ready", isComplete);

    if (isComplete) {
      setStatus("掌间傩势已成");
      NuoState.markComplete("completedGestures");
    } else if (!introReady) {
      setStatus("面具追踪中");
    } else if (!pendingId && stream) {
      setStatus(`等待识别：${current.name}`);
    } else if (!pendingId) {
      setStatus("摄像头未开启，点击模拟当前手诀");
    }
  }

  function completeGesture(id) {
    window.clearTimeout(pendingTimer);
    pendingTimer = null;
    pendingId = null;
    completed.add(id);
    NuoState.set("completedGestureIds", Array.from(completed));
    currentIndex = Math.min(completed.size, gestures.length - 1);
    playGestureTone(true);
    render();
  }

  function beginRecognition(id) {
    const current = getCurrentGesture();
    if (!introReady || completed.has(id) || id !== current.id || pendingId) return;
    pendingId = id;
    pendingStartedAt = performance.now();
    setStatus(`${current.name}识别中`);
    playGestureTone(false);
    render();

    pendingTimer = window.setTimeout(() => completeGesture(id), 3000);
    requestAnimationFrame(updatePendingProgress);
  }

  function updatePendingProgress(now) {
    if (!pendingId) return;
    const progress = Math.min(1, (now - pendingStartedAt) / 3000);
    const bar = els.lightList.querySelector(`[data-id="${pendingId}"] i`);
    if (bar) bar.style.transform = `scaleX(${progress})`;
    if (progress < 1) requestAnimationFrame(updatePendingProgress);
  }

  function getVideoCoverMetrics() {
    const rect = els.stage.getBoundingClientRect();
    const videoWidth = els.video.videoWidth || 1280;
    const videoHeight = els.video.videoHeight || 720;
    const scale = Math.max(rect.width / videoWidth, rect.height / videoHeight);
    const drawWidth = videoWidth * scale;
    const drawHeight = videoHeight * scale;
    return {
      width: rect.width,
      height: rect.height,
      videoWidth,
      videoHeight,
      scale,
      offsetX: (rect.width - drawWidth) / 2,
      offsetY: (rect.height - drawHeight) / 2
    };
  }

  function mapVideoLandmark(point) {
    const metrics = getVideoCoverMetrics();
    const rawX = metrics.offsetX + point.x * metrics.videoWidth * metrics.scale;
    const rawY = metrics.offsetY + point.y * metrics.videoHeight * metrics.scale;
    const mirroredX = metrics.width - rawX;
    return {
      x: mirroredX / Math.max(1, metrics.width),
      y: rawY / Math.max(1, metrics.height),
      px: mirroredX,
      py: rawY
    };
  }

  function resizeOverlayCanvas() {
    const rect = els.stage.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    els.handCanvas.width = Math.max(1, Math.round(rect.width * dpr));
    els.handCanvas.height = Math.max(1, Math.round(rect.height * dpr));
    els.handCanvas.style.width = `${rect.width}px`;
    els.handCanvas.style.height = `${rect.height}px`;
    handCtx = els.handCanvas.getContext("2d");
    handCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (three?.resize) three.resize();
  }

  function clearHandOverlay() {
    if (!handCtx) return;
    const rect = els.stage.getBoundingClientRect();
    handCtx.clearRect(0, 0, rect.width, rect.height);
  }

  function drawHandNodes(handLandmarks) {
    const handSets = handLandmarks?.[0]?.x !== undefined ? [handLandmarks] : handLandmarks;
    if (!handCtx || !handSets?.length) {
      clearHandOverlay();
      return;
    }
    const rect = els.stage.getBoundingClientRect();

    clearHandOverlay();
    handCtx.save();
    handCtx.lineCap = "round";
    handCtx.lineJoin = "round";
    handCtx.shadowColor = "rgba(255, 246, 221, 0.72)";
    handCtx.shadowBlur = 14;
    handCtx.strokeStyle = "rgba(240, 209, 138, 0.9)";
    handCtx.lineWidth = 2.6;

    handSets.forEach((landmarks) => {
      const points = landmarks.map((point) => ({
        x: (1 - point.x) * rect.width,
        y: point.y * rect.height
      }));

      handConnections.forEach(([start, end]) => {
        const a = points[start];
        const b = points[end];
        handCtx.beginPath();
        handCtx.moveTo(a.x, a.y);
        handCtx.lineTo(b.x, b.y);
        handCtx.stroke();
      });
      points.forEach((point, index) => {
        const isTip = [4, 8, 12, 16, 20].includes(index);
        handCtx.beginPath();
        handCtx.fillStyle = isTip ? "rgba(255, 246, 221, 0.98)" : "rgba(216, 160, 74, 0.95)";
        handCtx.arc(point.x, point.y, isTip ? 5.5 : 4, 0, Math.PI * 2);
        handCtx.fill();
      });
    });
    handCtx.restore();
  }

  function fingerExtended(landmarks, tip, mcp) {
    const wrist = landmarks[0];
    const tipDistance = Math.hypot(landmarks[tip].x - wrist.x, landmarks[tip].y - wrist.y);
    const mcpDistance = Math.hypot(landmarks[mcp].x - wrist.x, landmarks[mcp].y - wrist.y);
    return tipDistance > mcpDistance * 1.12;
  }

  function classifyGesture(landmarks) {
    if (!landmarks?.length) return null;
    const index = fingerExtended(landmarks, 8, 5);
    const middle = fingerExtended(landmarks, 12, 9);
    const ring = fingerExtended(landmarks, 16, 13);
    const pinky = fingerExtended(landmarks, 20, 17);
    const extendedCount = [index, middle, ring, pinky].filter(Boolean).length;

    if (middle && !ring && !pinky) return "zushijue";
    if (index && !middle && !ring && !pinky) return "dujiaojianjunjue";
    if (extendedCount >= 3) return "wuchangjue";
    return null;
  }

  async function loadThreeDeps() {
    const THREE = await import("three");
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const { EffectComposer } = await import("three/addons/postprocessing/EffectComposer.js");
    const { RenderPass } = await import("three/addons/postprocessing/RenderPass.js");
    const { UnrealBloomPass } = await import("three/addons/postprocessing/UnrealBloomPass.js");
    return { THREE, GLTFLoader, EffectComposer, RenderPass, UnrealBloomPass };
  }

  async function initThreeMask() {
    if (three) return three;
    const { THREE, GLTFLoader, EffectComposer, RenderPass, UnrealBloomPass } = await loadThreeDeps();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas: els.threeCanvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setClearColor(0x000000, 0);
    els.threeCanvas.style.mixBlendMode = "screen";

    const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      samples: 2,
      format: THREE.RGBAFormat,
      type: THREE.HalfFloatType
    });
    const composer = new EffectComposer(renderer, renderTarget);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.5, 0.4, 0.85);
    bloomPass.threshold = 0.16;
    bloomPass.strength = 1.55;
    bloomPass.radius = 0.9;
    composer.addPass(bloomPass);

    const params = { uTime: 0, uProgress: 0, targetProgress: 0 };
    const modelGroup = new THREE.Group();
    const materialsToUpdate = [];
    const solidMaskMaterials = [];
    const targetScale = new THREE.Vector3(1, 1, 1);
    let maskOriginalWidth = 1;
    let faceLocked = false;
    let referenceScreenFaceWidth = 0;
    let referenceFaceWidthSum = 0;
    let referenceFaceWidthSamples = 0;
    const referenceFaceSampleCount = 18;
    scene.add(modelGroup);

    const sandCount = 10000;
    const sandGeo = new THREE.BufferGeometry();
    const sandPositions = new Float32Array(sandCount * 3);
    const sandRandoms = new Float32Array(sandCount);
    for (let i = 0; i < sandCount; i++) {
      const radius = 4.5 * Math.sqrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      sandPositions[i * 3] = radius * Math.cos(theta);
      sandPositions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      sandPositions[i * 3 + 2] = radius * Math.sin(theta);
      sandRandoms[i] = Math.random();
    }
    sandGeo.setAttribute("position", new THREE.BufferAttribute(sandPositions, 3));
    sandGeo.setAttribute("aRandom", new THREE.BufferAttribute(sandRandoms, 1));
    const sandMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xf0d18a) } },
      vertexShader: `
        uniform float uTime;
        attribute float aRandom;
        varying float vAlpha;
        void main() {
          vec3 pos = position;
          float speed = 0.08 + aRandom * 0.15;
          pos.y += uTime * speed;
          pos.y = mod(pos.y + 6.0, 12.0) - 6.0;
          float angle = uTime * (0.05 + aRandom * 0.05) + pos.y * 0.2;
          float radius = length(pos.xz);
          pos.x = cos(angle) * radius + sin(uTime * 0.3 + aRandom * 10.0) * 0.15;
          pos.z = sin(angle) * radius + cos(uTime * 0.3 + aRandom * 10.0) * 0.15;
          vAlpha = smoothstep(-6.0, -4.0, pos.y) * (1.0 - smoothstep(4.0, 6.0, pos.y));
          vAlpha *= 0.15 + aRandom * 0.3;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (0.5 + aRandom) * (3.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;
          gl_FragColor = vec4(uColor * 1.5, exp(-r * 4.0) * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(sandGeo, sandMat));

    function resize() {
      const rect = els.stage.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      composer.setSize(rect.width, rect.height);
      bloomPass.setSize(rect.width, rect.height);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    }

    function makeParticleMask(gltf) {
      const meshTasks = [];
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.geometry) meshTasks.push(child);
      });

      meshTasks.forEach((mesh) => {
        const geometry = mesh.geometry;
        if (!geometry.attributes.uv) {
          geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
        }
        const count = geometry.attributes.position.count;
        const randoms = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) randoms[i] = (Math.random() - 0.5) * 6;
        geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));

        const map = mesh.material?.map || null;
        const color = mesh.material?.color || new THREE.Color(0xcc8855);
        const solidMat = new THREE.MeshBasicMaterial({
          map,
          color,
          transparent: true,
          opacity: 1,
          depthWrite: true,
          depthTest: true
        });
        solidMaskMaterials.push(solidMat);

        const particleMat = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uPointSize: { value: 2.0 },
            uTexture: { value: map },
            uHasTexture: { value: map ? 1 : 0 },
            uColor: { value: color }
          },
          vertexShader: `
            uniform float uTime;
            uniform float uProgress;
            uniform float uPointSize;
            attribute vec3 aRandom;
            varying vec2 vUv;
            vec3 noise(vec3 p) {
              return vec3(
                sin(p.x * 5.0 + uTime * 0.5) * 0.015,
                cos(p.y * 5.0 + uTime * 0.5) * 0.015,
                sin(p.z * 5.0 + uTime * 0.5) * 0.015
              );
            }
            void main() {
              vUv = uv;
              vec3 jitter = noise(position) * (0.2 + uProgress * 0.8);
              if (uProgress < 0.05) jitter *= 0.0;
              vec3 basePosition = position + jitter;
              vec3 explodedPosition = basePosition + aRandom * 3.0;
              explodedPosition.y += aRandom.y * uProgress * 2.0;
              vec3 finalPosition = mix(basePosition, explodedPosition, uProgress);
              vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
              gl_Position = projectionMatrix * mvPosition;
              float pSize = uPointSize * (4.0 / -mvPosition.z) * (1.0 + uProgress * 1.5);
              float maxSize = mix(8.0, 120.0, uProgress);
              gl_PointSize = min(pSize, maxSize);
            }
          `,
          fragmentShader: `
            uniform sampler2D uTexture;
            uniform float uHasTexture;
            uniform vec3 uColor;
            uniform float uProgress;
            varying vec2 vUv;
            void main() {
              vec2 cxy = 2.0 * gl_PointCoord - 1.0;
              float r = dot(cxy, cxy);
              if (r > 1.0) discard;
              float alpha = 1.0 - smoothstep(0.6, 1.0, r);
              float globalAlpha = smoothstep(0.12, 1.0, uProgress);
              vec3 finalColor = uColor;
              if (uHasTexture > 0.5) finalColor = texture2D(uTexture, vUv).rgb;
              finalColor *= mix(2.0, 3.0, uProgress);
              gl_FragColor = vec4(finalColor, alpha * globalAlpha * 1.4);
            }
          `,
          transparent: true,
          depthWrite: true,
          alphaTest: 0.1,
          blending: THREE.NormalBlending
        });
        materialsToUpdate.push(particleMat);
        const solidMesh = new THREE.Mesh(geometry, solidMat);
        solidMesh.position.copy(mesh.position);
        solidMesh.rotation.copy(mesh.rotation);
        solidMesh.scale.copy(mesh.scale);

        const points = new THREE.Points(geometry, particleMat);
        points.position.copy(mesh.position);
        points.rotation.copy(mesh.rotation);
        points.scale.copy(mesh.scale);

        const occluderMat = new THREE.MeshBasicMaterial({
          colorWrite: false,
          depthWrite: true,
          depthTest: true
        });
        const occluderMesh = new THREE.Mesh(geometry, occluderMat);
        occluderMesh.position.copy(mesh.position);
        occluderMesh.rotation.copy(mesh.rotation);
        occluderMesh.scale.set(0.995, 0.995, 0.995);

        const parent = mesh.parent;
        if (parent) {
          parent.remove(mesh);
          parent.add(solidMesh);
          parent.add(points);
          parent.add(occluderMesh);
        }
      });

      gltf.scene.rotation.set(0, Math.PI / 2, Math.PI);
      modelGroup.add(gltf.scene);
      const box = new THREE.Box3().setFromObject(modelGroup);
      const center = new THREE.Vector3();
      box.getCenter(center);
      gltf.scene.position.sub(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      maskOriginalWidth = size.x || 1;
      modelLoaded = true;
      params.uProgress = 0;
      params.targetProgress = 0;
      setStatus(introReady ? `等待识别：${getCurrentGesture().name}` : "面具追踪中");
    }

    async function loadModel() {
      if (modelLoaded) return;
      const loader = new GLTFLoader();
      const modelUrl = NuoRouter.asset(mask.model);
      setStatus("正在加载面具模型");
      await new Promise((resolve, reject) => {
        loader.load(modelUrl, (gltf) => {
          makeParticleMask(gltf);
          resolve();
        }, undefined, (error) => {
          console.warn("gesture GLB load failed", modelUrl, error);
          reject(error);
        });
      });
    }

    function stagePointToWorld(point) {
      const ndcX = point.x * 2 - 1;
      const ndcY = -(point.y * 2 - 1);
      const vector = new THREE.Vector3(ndcX, ndcY, 0.5);
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = -camera.position.z / dir.z;
      return camera.position.clone().add(dir.multiplyScalar(distance));
    }

    function updateFace(face) {
      if (!modelLoaded) {
        three?.showCentered?.();
        return;
      }
      const nosePoint = mapVideoLandmark(face[1]);
      const leftCheek = face[234];
      const rightCheek = face[454];
      const leftPoint = mapVideoLandmark(leftCheek);
      const rightPoint = mapVideoLandmark(rightCheek);
      const noseWorld = stagePointToWorld(nosePoint);
      const pLeft = stagePointToWorld(leftPoint);
      const pRight = stagePointToWorld(rightPoint);

      const worldFaceWidth = pLeft.distanceTo(pRight);
      const yawAmount = THREE.MathUtils.clamp(-(rightCheek.z - leftCheek.z) * 2.5, -0.95, 0.95);
      const yaw = Math.asin(yawAmount);
      const yawCorrection = 1 / Math.max(Math.cos(yaw), 0.58);
      const correctedWorldFaceWidth = worldFaceWidth * yawCorrection;
      const screenFaceWidth = Math.hypot(rightCheek.x - leftCheek.x, rightCheek.y - leftCheek.y);
      const correctedScreenFaceWidth = screenFaceWidth * yawCorrection;

      if (!referenceScreenFaceWidth && correctedScreenFaceWidth > 0.02) {
        referenceFaceWidthSum += correctedScreenFaceWidth;
        referenceFaceWidthSamples++;
        if (referenceFaceWidthSamples >= referenceFaceSampleCount) {
          referenceScreenFaceWidth = referenceFaceWidthSum / referenceFaceWidthSamples;
        }
      }

      const faceDistanceRatio = referenceScreenFaceWidth ? correctedScreenFaceWidth / referenceScreenFaceWidth : 1;
      const distanceMultiplier = THREE.MathUtils.clamp(
        Math.pow(faceDistanceRatio, fit.distanceResponse),
        fit.distanceMinMultiplier,
        fit.distanceMaxMultiplier
      );
      const targetPos = noseWorld.clone();
      targetPos.y += worldFaceWidth * fit.yOffsetByFace;
      const fittedScale = (correctedWorldFaceWidth / maskOriginalWidth) * fit.maskToFaceWidth * distanceMultiplier;
      const scale = THREE.MathUtils.clamp(fittedScale, fit.minScale, fit.maxScale);
      targetScale.set(scale * 1.12, scale, scale);
      if (!faceLocked) {
        modelGroup.position.copy(targetPos);
        modelGroup.scale.copy(targetScale);
        faceLocked = true;
      } else {
        modelGroup.position.lerp(targetPos, fit.positionEase);
        modelGroup.scale.lerp(targetScale, fit.scaleEase);
      }

      const pitch = -Math.asin(THREE.MathUtils.clamp((face[10].z - face[152].z) * 2, -0.95, 0.95));
      const roll = Math.atan2(-(rightCheek.y - leftCheek.y), -(rightCheek.x - leftCheek.x));
      modelGroup.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll)), fit.rotationEase);
    }

    function showCentered(immediate = false) {
      if (!modelLoaded) return;
      const centerPos = new THREE.Vector3(0, 0.05, 0);
      const scale = THREE.MathUtils.clamp(fit.fallbackScale, fit.minScale, fit.maxScale);
      targetScale.set(scale, scale, scale);
      const targetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
      if (immediate) {
        modelGroup.position.copy(centerPos);
        modelGroup.scale.copy(targetScale);
        modelGroup.quaternion.copy(targetQuat);
      } else {
        modelGroup.position.lerp(centerPos, 0.35);
        modelGroup.scale.lerp(targetScale, 0.35);
        modelGroup.quaternion.slerp(targetQuat, 0.25);
      }
    }

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      resize();
      params.uTime += clock.getDelta();
      const progressEase = params.targetProgress > params.uProgress ? 0.08 : 0.045;
      params.uProgress += (params.targetProgress - params.uProgress) * progressEase;
      materialsToUpdate.forEach((mat) => {
        mat.uniforms.uTime.value = params.uTime;
        mat.uniforms.uProgress.value = params.uProgress;
      });
      solidMaskMaterials.forEach((mat) => {
        mat.opacity = 1;
        mat.visible = params.uProgress < 0.18;
      });
      sandMat.uniforms.uTime.value = params.uTime;
      composer.render();
    }

    three = { THREE, params, updateFace, resize, loadModel, showCentered };
    resize();
    animate();
    return three;
  }

  async function showModelPreview() {
    els.threeCanvas.style.opacity = "1";
    els.handCanvas.style.opacity = "1";
    resizeOverlayCanvas();
    const rendererState = await initThreeMask();
    await rendererState.loadModel();
    rendererState.showCentered?.(true);
    return rendererState;
  }

  function initMediaPipe() {
    const hasFaceMesh = Boolean(window.FaceMesh);
    const hasHands = Boolean(window.Hands);
    if (!hasFaceMesh && !hasHands) {
      setStatus("识别库暂不可用，点击可模拟当前手诀");
      return false;
    }
    if (hasFaceMesh && !faceMesh) {
      faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
      faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      faceMesh.onResults((results) => {
        const face = results.multiFaceLandmarks?.[0];
        if (!face) {
          three?.showCentered?.();
          return;
        }
        three?.updateFace(face);
      });
    }
    if (hasHands && !hands) {
      hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
      hands.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      hands.onResults((results) => {
        const detectedHands = results.multiHandLandmarks || [];
        if (!detectedHands.length) {
          clearHandOverlay();
          return;
        }
        drawHandNodes(detectedHands);
        if (!introReady) return;
        const detectedId = detectedHands.map((hand) => classifyGesture(hand)).find(Boolean);
        if (detectedId) beginRecognition(detectedId);
      });
    }
    return hasFaceMesh || hasHands;
  }

  async function startCamera() {
    if (cameraStarting) return;
    if (stream) {
      beginRecognition(getCurrentGesture().id);
      return;
    }
    cameraStarting = true;
    let rendererState = null;
    try {
      setStatus("正在开启摄像头");
      try {
        rendererState = await showModelPreview();
      } catch (error) {
        console.warn("gesture model preview failed", error);
        els.threeCanvas.style.opacity = "0";
        setStatus("GLB 面具模型暂不可用，请检查模型资源");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        if (rendererState) rendererState.showCentered?.(true);
        setStatus("摄像头不可用，已保留 GLB 模型预览");
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      els.video.srcObject = stream;
      await els.video.play();
      els.video.style.display = "block";
      els.stage.classList.add("is-camera-live");
      els.threeCanvas.style.opacity = rendererState ? "1" : "0";
      els.handCanvas.style.opacity = "1";
      resizeOverlayCanvas();
      const hasPipe = initMediaPipe();
      if (!rendererState) {
        try {
          rendererState = await initThreeMask();
          await rendererState.loadModel();
          els.threeCanvas.style.opacity = "1";
        } catch (error) {
          console.warn("gesture model load failed after camera start", error);
          setStatus("摄像头已开启，但 GLB 面具模型暂不可用");
        }
      }
      if (rendererState) {
        rendererState.showCentered?.(true);
      }
      tracking = hasPipe;
      if (tracking) requestAnimationFrame(processVideoFrame);
      render();
    } catch (error) {
      console.warn("gesture camera start failed", error);
      els.stage.classList.remove("is-camera-live");
      els.video.style.display = "none";
      if (rendererState) {
        rendererState.showCentered?.(true);
        setStatus("摄像头未开启，点击模拟当前手诀");
      } else {
        setStatus("摄像头未开启，点击模拟当前手诀");
      }
    } finally {
      cameraStarting = false;
    }
  }

  async function processVideoFrame() {
    if (!tracking) return;
    if (els.video.readyState >= 2 && !els.video.paused && els.video.currentTime !== lastVideoTime) {
      lastVideoTime = els.video.currentTime;
      if (faceMesh) {
        try {
          await faceMesh.send({ image: els.video });
        } catch (error) {
          console.warn("gesture face frame failed", error);
        }
      }
      if (hands) {
        try {
          await hands.send({ image: els.video });
        } catch (error) {
          console.warn("gesture hand frame failed", error);
        }
      }
    }
    requestAnimationFrame(processVideoFrame);
  }

  function startIntroCue() {
    const first = gestures[0];
    els.startCue.textContent = `请根据手势提示做出${first.name}！`;
    els.startCue.hidden = false;
    els.stage.classList.add("is-intro-cue");
    window.setTimeout(() => {
      introReady = true;
      els.startCue.classList.add("is-hidden");
      els.stage.classList.remove("is-intro-cue");
      render();
      window.setTimeout(() => {
        els.startCue.hidden = true;
      }, 360);
    }, 2000);
  }

  els.cameraButton.addEventListener("click", () => {
    if (stream) beginRecognition(getCurrentGesture().id);
    else startCamera();
  });
  els.currentCard.addEventListener("click", () => beginRecognition(getCurrentGesture().id));
  els.next.addEventListener("click", () => {
    if (els.next.disabled) return;
    NuoRouter.go("pages/instruments.html");
  });
  window.addEventListener("resize", resizeOverlayCanvas);

  resizeOverlayCanvas();
  render();
  startIntroCue();
  startCamera();
})();
