(function () {
  let THREE = null;
  let GLTFLoader = null;

  const INTRO_DURATION = 4500;
  const INTRO_FADE_MS = 900;
  const overlay = document.getElementById("introOverlay");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finishIntro() {
    document.body.classList.add("is-home-ready");
    document.body.classList.remove("is-intro-active");
    window.NuoAudio?.playBackgroundFromStart?.();
    if (!overlay) return;
    overlay.classList.add("is-intro-exiting");
    window.setTimeout(() => {
      overlay.remove();
    }, reduceMotion ? 80 : INTRO_FADE_MS);
  }

  async function loadThreeModules() {
    THREE = await import("three");
    ({ GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js"));
  }

  function convertMeshToDemoParticles(mesh, materialsToUpdate) {
    const geometry = mesh.geometry;

    if (!geometry.attributes.uv) {
      const uvs = new Float32Array(geometry.attributes.position.count * 2);
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
    if (!geometry.attributes.normal) {
      geometry.computeVertexNormals();
    }

    const count = geometry.attributes.position.count;
    const randoms = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count * 3; i += 1) {
      randoms[i] = (Math.random() - 0.5) * 6.0;
    }
    for (let i = 0; i < count; i += 1) {
      seeds[i] = Math.random();
    }
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const sourceMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    const map = sourceMaterial?.map || null;
    if (map) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.needsUpdate = true;
    }
    const color = sourceMaterial?.color || new THREE.Color(0xcc8855);

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uPointSize: { value: 1.76 },
        uTexture: { value: map },
        uHasTexture: { value: map ? 1.0 : 0.0 },
        uColor: { value: color }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform float uPointSize;

        attribute vec3 aRandom;
        attribute float aSeed;
        varying vec2 vUv;
        varying float vEdge;
        varying float vSeed;

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
          vec3 basePosition = position + jitter;

          vec3 explodedPosition = basePosition + aRandom * 8.0;
          explodedPosition.y += aRandom.y * uProgress * 6.0;
          explodedPosition.z += aRandom.z * uProgress * 6.0;

          float angle = uProgress * 6.28318;
          mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          explodedPosition.xz = rot * explodedPosition.xz;

          vec3 finalPosition = mix(basePosition, explodedPosition, uProgress);

          vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          vec3 viewNormal = normalize(normalMatrix * normal);
          vec3 viewDir = normalize(-mvPosition.xyz);
          float silhouette = 1.0 - abs(dot(viewNormal, viewDir));
          vEdge = smoothstep(0.54, 0.96, silhouette) * (1.0 - uProgress * 0.34);
          vSeed = aSeed;

          float pSize = uPointSize * (4.0 / -mvPosition.z) * (1.0 + uProgress * 15.0);
          pSize *= 1.0 + vEdge * step(0.76, aSeed) * 0.82;
          float dynamicMax = mix(8.0, 100.0, uProgress);
          gl_PointSize = min(pSize, dynamicMax);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform float uHasTexture;
        uniform vec3 uColor;
        uniform float uProgress;

        varying vec2 vUv;
        varying float vEdge;
        varying float vSeed;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;

          float edgeSoftness = mix(0.8, 0.2, uProgress);
          float coreAlpha = 1.0 - smoothstep(edgeSoftness, 1.0, r);
          float alpha = coreAlpha;
          float globalAlpha = 1.0 - (uProgress * 0.8);

          vec3 finalColor = uColor;
          if (uHasTexture > 0.5) {
            finalColor = texture2D(uTexture, vUv).rgb;
          }

          float luminance = dot(finalColor, vec3(0.299, 0.587, 0.114));
          float darkParticle = 1.0 - smoothstep(0.07, 0.36, luminance);
          float litParticle = 1.0 - darkParticle;
          float sameColorHalo = exp(-r * 1.08) * 1.46 * litParticle;
          alpha = max(alpha, sameColorHalo);
          alpha = mix(alpha, 1.0, darkParticle * 0.96);

          vec3 solidBlack = mix(vec3(0.0015), max(finalColor * 0.42, vec3(0.012)), 0.34);
          vec3 litColor = finalColor * mix(3.95, 6.35, uProgress);
          litColor += finalColor * exp(-r * 1.02) * 3.05;
          finalColor = mix(litColor, solidBlack, darkParticle);

          float redEdgeParticle = vEdge * step(0.79, vSeed) * (1.0 - smoothstep(0.62, 1.0, uProgress));
          float redCore = (1.0 - smoothstep(0.14, 0.64, r)) * redEdgeParticle;
          float redHalo = exp(-r * 0.86) * redEdgeParticle;
          vec3 redEdgeColor = vec3(1.0, 0.075, 0.018) * (1.25 + redHalo * 1.75);
          finalColor = mix(finalColor, redEdgeColor, clamp(redCore + redHalo * 0.42, 0.0, 0.86));
          alpha = max(alpha, redCore * 0.92 + redHalo * 0.36);

          gl_FragColor = vec4(finalColor, alpha * globalAlpha);
        }
      `,
      transparent: true,
      depthWrite: true,
      alphaTest: 0.005,
      blending: THREE.NormalBlending
    });

    materialsToUpdate.push(particleMaterial);

    const points = new THREE.Points(geometry, particleMaterial);
    points.position.copy(mesh.position);
    points.rotation.copy(mesh.rotation);
    points.scale.copy(mesh.scale);

    const occluderMaterial = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
      side: THREE.FrontSide
    });
    const occluderMesh = new THREE.Mesh(geometry, occluderMaterial);
    occluderMesh.position.copy(mesh.position);
    occluderMesh.rotation.copy(mesh.rotation);
    occluderMesh.scale.copy(mesh.scale);
    occluderMesh.scale.multiplyScalar(0.995);

    const parent = mesh.parent;
    parent.remove(mesh);
    parent.add(points);
    parent.add(occluderMesh);
  }

  function createDemoSandSystem(scene) {
    const sandCount = 2200;
    const sandGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(sandCount * 3);
    const randoms = new Float32Array(sandCount);

    for (let i = 0; i < sandCount; i += 1) {
      const radius = 1.2 + Math.random() * 4.2;
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8.5;
      positions[i * 3 + 2] = Math.sin(angle) * radius - 0.7;
      randoms[i] = Math.random();
    }

    sandGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    sandGeo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

    const sandMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xff4a10) }
      },
      vertexShader: `
        uniform float uTime;
        attribute float aRandom;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          float speed = 0.08 + aRandom * 0.15;
          pos.y += uTime * speed;
          pos.y = mod(pos.y + 5.0, 10.0) - 5.0;

          float angle = uTime * (0.05 + aRandom * 0.05) + pos.y * 0.2;
          float radius = length(pos.xz);
          pos.x = cos(angle) * radius;
          pos.z = sin(angle) * radius;

          pos.x += sin(uTime * 0.3 + aRandom * 10.0) * 0.15;
          pos.z += cos(uTime * 0.3 + aRandom * 10.0) * 0.15;

          vAlpha = smoothstep(-5.0, -3.0, pos.y) * (1.0 - smoothstep(3.0, 5.0, pos.y));
          vAlpha *= (0.15 + aRandom * 0.3);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          gl_PointSize = (0.5 + aRandom * 1.0) * (3.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;

          float alpha = exp(-r * 4.0) * vAlpha;
          gl_FragColor = vec4(uColor * 1.5, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const sandSystem = new THREE.Points(sandGeo, sandMat);
    scene.add(sandSystem);
    return sandMat;
  }

  async function initCoverMask() {
    const canvas = document.getElementById("coverMaskCanvas");
    const field = canvas?.closest(".cover-mask-field");
    if (!canvas || !field) return;

    try {
      await loadThreeModules();
    } catch (error) {
      document.body.classList.add("is-cover-mask-fallback");
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 6.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setClearAlpha(0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const params = { uTime: 0, uProgress: 0, targetProgress: 0 };
    const materialsToUpdate = [];
    const modelGroup = new THREE.Group();
    const dragState = {
      isDragging: false,
      lastX: 0,
      rotationY: 0
    };
    scene.add(modelGroup);

    const sandMat = createDemoSandSystem(scene);
    scene.add(new THREE.AmbientLight(0xffd1a3, 1.15));

    function resize() {
      const rect = field.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      renderer.setPixelRatio(dpr);
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    }

    resize();
    window.addEventListener("resize", resize);
    document.body.classList.add("is-cover-mask-ready");

    field.style.pointerEvents = "auto";
    field.addEventListener("pointerdown", (event) => {
      dragState.isDragging = true;
      dragState.lastX = event.clientX;
      field.setPointerCapture?.(event.pointerId);
      field.classList.add("is-cover-mask-dragging");
    });

    field.addEventListener("pointermove", (event) => {
      if (!dragState.isDragging) return;
      const deltaX = event.clientX - dragState.lastX;
      dragState.lastX = event.clientX;
      dragState.rotationY += deltaX * 0.008;
    });

    function stopDrag(event) {
      if (!dragState.isDragging) return;
      dragState.isDragging = false;
      field.releasePointerCapture?.(event.pointerId);
      field.classList.remove("is-cover-mask-dragging");
    }

    field.addEventListener("pointerup", stopDrag);
    field.addEventListener("pointercancel", stopDrag);
    field.addEventListener("pointerleave", stopDrag);

    try {
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load("assets/models/masks/guizhou-kaishan-mangjiang.glb", resolve, undefined, reject);
      });

      const meshes = [];
      gltf.scene.traverse((child) => {
        if (child.isMesh) meshes.push(child);
      });
      meshes.forEach((mesh) => convertMeshToDemoParticles(mesh, materialsToUpdate));

      modelGroup.add(gltf.scene);

      const box = new THREE.Box3().setFromObject(modelGroup);
      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);
      modelGroup.position.sub(center);

      const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
      modelGroup.scale.setScalar(6.0 / maxAxis);
      modelGroup.scale.x *= 0.75;
      modelGroup.position.x += 0.38;
      modelGroup.position.y -= 0.08;
      modelGroup.userData.frontRotationY = Math.PI * 1.5;
      dragState.rotationY = modelGroup.userData.frontRotationY;
      modelGroup.rotation.y = modelGroup.userData.frontRotationY;
    } catch (error) {
      document.body.classList.add("is-cover-mask-fallback");
      return;
    }

    const clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      params.uTime += delta;
      params.uProgress += (params.targetProgress - params.uProgress) * 0.08;

      materialsToUpdate.forEach((mat) => {
        mat.uniforms.uTime.value = params.uTime;
        mat.uniforms.uProgress.value = params.uProgress;
      });

      sandMat.uniforms.uTime.value = params.uTime;
      const idleSway = dragState.isDragging ? 0 : Math.sin(params.uTime * 0.09) * (Math.PI / 18);
      modelGroup.rotation.y = dragState.rotationY + idleSway;

      renderer.clear(true, true, true);
      renderer.render(scene, camera);
    }

    animate();
  }

  window.setTimeout(finishIntro, reduceMotion ? 400 : INTRO_DURATION);
  initCoverMask();
})();
