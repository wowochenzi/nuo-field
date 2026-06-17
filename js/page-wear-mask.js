(function () {
  const mask = NuoState.getSelectedMask();
  const els = {
    info: document.getElementById("wearInfo"),
    stage: document.getElementById("wearStage"),
    video: document.getElementById("wearVideo"),
    fallback: document.getElementById("wearFallback"),
    png: document.getElementById("wearMaskPng"),
    threeCanvas: document.getElementById("wearThreeCanvas"),
    handCanvas: document.getElementById("wearHandCanvas"),
    status: document.getElementById("wearStatus") || document.getElementById("simulateWear"),
    simulate: document.getElementById("simulateWear"),
    enter: document.getElementById("enterGestures")
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

  let stream = null;
  let tracking = false;
  let lastVideoTime = -1;
  let faceMesh = null;
  let hands = null;
  let handCtx = null;
  let three = null;
  let modelLoaded = false;
  let cameraStarting = false;

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

  function renderInfo() {
    const isKaishan = mask.id === "guizhou-kaishan-mangjiang";
    const info = isKaishan ? {
      name: "开山莽将",
      meaning: "以凶制凶、破除灾厄、护佑平安",
      intro: "开山，又称开山猛将或开山莽将，是傩坛中法力最威猛的镇妖神祇，象征以暴烈神威震摄邪祟。开山往往作为傩戏、傩仪中开场的核心角色，承担为愿主家斩除妖邪的神职。",
      source: "集中记载于西南民间历代傩师手抄传承的《傩堂戏法本》、科仪书以及专属剧本《打开山》。"
    } : {
      name: mask.name,
      meaning: mask.meaning || mask.role || "地域仪式角色",
      intro: mask.description || `${mask.region}傩戏角色谱系中的代表性面具。`,
      source: mask.source || "该角色的专属记载来源将于后续补充。"
    };
    els.info.innerHTML = `
      <h2>面具信息</h2>
      <dl class="wear-mask-facts">
        <div>
          <dt>面具名称</dt>
          <dd>${info.name}</dd>
        </div>
        <div>
          <dt>寓意</dt>
          <dd>${info.meaning}</dd>
        </div>
        <div>
          <dt>形象简介</dt>
          <dd>${info.intro}</dd>
        </div>
        <div>
          <dt>记载来源</dt>
          <dd>${info.source}</dd>
        </div>
      </dl>
    `;
    els.png.src = NuoRouter.asset(mask.image);
  }

  function setStatus(text) {
    if (els.status) els.status.textContent = text;
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

  function drawHandNodes(landmarks) {
    if (!handCtx || !landmarks?.length) {
      clearHandOverlay();
      return;
    }
    const rect = els.stage.getBoundingClientRect();
    clearHandOverlay();
    const points = landmarks.map((point) => ({
      x: (1 - point.x) * rect.width,
      y: point.y * rect.height
    }));

    handCtx.save();
    handCtx.lineCap = "round";
    handCtx.lineJoin = "round";
    handCtx.shadowColor = "rgba(255, 246, 221, 0.72)";
    handCtx.shadowBlur = 14;
    handCtx.strokeStyle = "rgba(240, 209, 138, 0.92)";
    handCtx.lineWidth = 3;
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
      const radius = isTip ? 5.8 : 4.2;
      handCtx.beginPath();
      handCtx.fillStyle = isTip ? "rgba(255, 246, 221, 0.98)" : "rgba(233, 111, 74, 0.95)";
      handCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
      handCtx.fill();
      handCtx.beginPath();
      handCtx.strokeStyle = "rgba(240, 209, 138, 0.75)";
      handCtx.lineWidth = 1.2;
      handCtx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
      handCtx.stroke();
    });
    handCtx.restore();
  }

  function isHandOpen(landmarks) {
    let openFingers = 0;
    const tips = [8, 12, 16, 20];
    const mcps = [5, 9, 13, 17];
    const wrist = landmarks[0];
    for (let i = 0; i < 4; i++) {
      const distTip = Math.hypot(landmarks[tips[i]].x - wrist.x, landmarks[tips[i]].y - wrist.y);
      const distMcp = Math.hypot(landmarks[mcps[i]].x - wrist.x, landmarks[mcps[i]].y - wrist.y);
      if (distTip > distMcp) openFingers++;
    }
    return openFingers >= 3;
  }

  function updatePngFromFace(face) {
    const nose = face[1];
    const left = face[234];
    const right = face[454];
    const nosePoint = mapVideoLandmark(nose);
    const leftPoint = mapVideoLandmark(left);
    const rightPoint = mapVideoLandmark(right);
    const facePixelWidth = Math.hypot(rightPoint.px - leftPoint.px, rightPoint.py - leftPoint.py);
    const pngWidth = Math.max(180, Math.min(560, facePixelWidth * 1.18));
    els.png.style.left = `${nosePoint.x * 100}%`;
    els.png.style.top = `${nosePoint.y * 100 - 2}%`;
    els.png.style.width = `${pngWidth}px`;
    els.png.style.transform = "translate(-50%, -50%)";
  }

  function enterSimulatedMode(message = "点击模拟佩戴") {
    stopCamera();
    tracking = false;
    els.stage.classList.add("is-simulated");
    els.video.style.display = "none";
    els.png.style.opacity = "1";
    els.png.style.left = "50%";
    els.png.style.top = "47%";
    els.png.style.width = "min(580px, 40vw)";
    els.png.style.transform = "translate(-50%, -50%)";
    els.threeCanvas.style.opacity = "0";
    els.handCanvas.style.opacity = "0";
    clearHandOverlay();
    setStatus(message);
  }

  async function showModelPreview(message = "正在唤醒面具模型...") {
    els.stage.classList.remove("is-simulated");
    els.video.style.display = stream ? "block" : "none";
    els.threeCanvas.style.opacity = "1";
    els.handCanvas.style.opacity = "0";
    els.png.style.opacity = "0";
    clearHandOverlay();
    resizeOverlayCanvas();
    setStatus(message);
    const rendererState = await initThreeMask();
    await rendererState.loadModel();
    rendererState.params.targetProgress = 0;
    rendererState.params.uProgress = 0;
    rendererState.showCentered?.(true);
    setStatus("当前状态：模型已出现，正在请求摄像头");
    return rendererState;
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
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
      els.png.style.opacity = "0";
      params.uProgress = 0;
      params.targetProgress = 0;
      setStatus("当前状态：模型就绪，等待人脸锁定");
    }

    async function loadModel() {
      if (modelLoaded) return;
      const loader = new GLTFLoader();
      const modelUrl = NuoRouter.asset(mask.model);
      setStatus(`正在加载 GLB 模型：${mask.model}`);
      await new Promise((resolve, reject) => {
        loader.load(modelUrl, (gltf) => {
          makeParticleMask(gltf);
          resolve();
        }, undefined, (error) => {
          console.warn("GLB load failed", modelUrl, error);
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
        updatePngFromFace(face);
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
      els.png.style.opacity = "0";
      setStatus("当前状态：GLB 模型贴脸追踪");
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

  function initMediaPipe() {
    const hasFaceMesh = Boolean(window.FaceMesh);
    const hasHands = Boolean(window.Hands);
    if (!hasFaceMesh && !hasHands) {
      setStatus("MediaPipe 识别库暂不可用，已保留摄像头与 GLB 模型预览");
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
        if (!modelLoaded) setStatus("当前状态：PNG 面具跟随人脸");
      });
    }
    if (hasHands && !hands) {
      hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
      hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      hands.onResults((results) => {
        const hand = results.multiHandLandmarks?.[0];
        if (!hand) {
          clearHandOverlay();
          if (three?.params) three.params.targetProgress = 0;
          return;
        }
        drawHandNodes(hand);
        const open = isHandOpen(hand);
        if (three?.params) three.params.targetProgress = open ? 1 : 0;
        setStatus(modelLoaded ? (open ? "当前状态：GLB 魂散" : "当前状态：GLB 聚形") : (open ? "当前状态：PNG 魂散" : "当前状态：PNG 聚形"));
      });
    }
    if (!hasHands) setStatus("手势识别库暂不可用，已保留人脸追踪");
    return hasFaceMesh || hasHands;
  }

  async function startCamera() {
    if (cameraStarting) return;
    if (stream) {
      setStatus(modelLoaded ? "当前状态：锁定追踪" : "当前状态：摄像头已开启");
      return;
    }
    cameraStarting = true;
    let rendererState = null;
    try {
      els.simulate.disabled = true;
      try {
        rendererState = await showModelPreview();
      } catch (error) {
        console.warn("wear model preview failed", error);
        els.png.style.opacity = "0.9";
        setStatus("GLB 粒子模型暂不可用，请检查模型资源或 Three.js 加载");
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        if (rendererState) {
          setStatus("摄像头不可用，已保留面具模型预览");
        } else {
          enterSimulatedMode("摄像头不可用，点击可重试");
        }
        return;
      }
      setStatus("正在请求摄像头权限...");
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      els.video.srcObject = stream;
      await els.video.play();
      els.video.style.display = "block";
      els.stage.classList.remove("is-simulated");
      els.threeCanvas.style.opacity = "1";
      els.handCanvas.style.opacity = "1";
      els.png.style.opacity = modelLoaded ? "0" : "0.42";
      resizeOverlayCanvas();
      const hasPipe = initMediaPipe();
      if (!rendererState) {
        try {
          rendererState = await initThreeMask();
          await rendererState.loadModel();
          rendererState.params.targetProgress = 0;
        } catch (error) {
          console.warn("wear model load failed after camera start", error);
          modelLoaded = false;
          els.png.style.opacity = "0.9";
          setStatus("摄像头已开启，但 GLB 粒子模型暂不可用");
          tracking = hasPipe;
          if (tracking) requestAnimationFrame(processVideoFrame);
          return;
        }
      }
      rendererState.showCentered?.(true);
      els.png.style.opacity = modelLoaded ? "0" : "0.42";

      tracking = hasPipe;
      if (tracking) requestAnimationFrame(processVideoFrame);
      else {
        three?.showCentered?.(true);
        setStatus("摄像头已开启，识别库暂不可用，已保持模型模拟佩戴");
      }
    } catch (error) {
      console.warn("wear camera start failed", error);
      if (rendererState) {
        els.video.style.display = "none";
        els.handCanvas.style.opacity = "0";
        els.threeCanvas.style.opacity = "1";
        els.png.style.opacity = "0";
        rendererState.showCentered?.(true);
        setStatus("摄像头权限未开启，已保留面具模型预览");
      } else {
        enterSimulatedMode("摄像头权限未开启，点击可重试");
      }
    } finally {
      cameraStarting = false;
      els.simulate.disabled = false;
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
          console.warn("face frame failed", error);
        }
      }
      if (hands) {
        try {
          await hands.send({ image: els.video });
        } catch (error) {
          console.warn("hand frame failed", error);
          setStatus("手势识别帧暂不可用，已保留当前佩戴状态");
        }
      }
    }
    requestAnimationFrame(processVideoFrame);
  }

  els.simulate.addEventListener("click", startCamera);
  els.enter.addEventListener("click", () => {
    NuoState.markComplete("completedWear");
    NuoRouter.go("pages/gestures.html");
  });
  window.addEventListener("resize", resizeOverlayCanvas);

  renderInfo();
  resizeOverlayCanvas();
  enterSimulatedMode();
})();
