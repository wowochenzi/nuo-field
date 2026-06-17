import * as THREE from "three";

const container = document.getElementById("coverTitleParticles");
const loading = document.getElementById("coverTitleLoading");

function assetPath(path) {
  return window.NuoRouter?.asset ? window.NuoRouter.asset(path) : path;
}

function setLoading(text) {
  if (loading) loading.textContent = text;
}

function initTitleParticles() {
  if (!container) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.set(0, 0, 8);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const params = { uTime: 0, uProgress: 0.0, targetProgress: 1.0 };
  let textPoints = null;
  let textMaterial = null;
  let textHaloPoints = null;
  let textHaloMaterial = null;

  function resize() {
    const rect = container.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  resize();

  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(assetPath("assets/images/home/title-frame.png"), (texture) => {
    const image = texture.image;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const vertices = [];
    const startPositions = [];
    const delays = [];
    const colors = [];

    const imgW = canvas.width;
    const imgH = canvas.height;
    const maxDim = Math.max(imgW, imgH);
    const scale = 6.5 / maxDim;

    const step = Math.max(1, Math.round(maxDim / 1200));
    const particleCopies = 2;

    for (let y = 0; y < imgH; y += step) {
      for (let x = 0; x < imgW; x += step) {
        const i = (y * imgW + x) * 4;
        const red = imgData.data[i];
        const green = imgData.data[i + 1];
        const blue = imgData.data[i + 2];
        const alpha = imgData.data[i + 3];
        const brightness = Math.max(red, green, blue);

        if (alpha > 90 && brightness > 18) {
          for (let copy = 0; copy < particleCopies; copy += 1) {
            const targetX = (x - imgW / 2) * scale + (Math.random() - 0.5) * scale * 0.34;
            const targetY = -(y - imgH / 2) * scale + (Math.random() - 0.5) * scale * 0.34;
            const targetZ = (Math.random() - 0.5) * 0.03;
            vertices.push(targetX, targetY, targetZ);

            const startX = 6.5 + (Math.random() - 0.5) * 4.0;
            const startY = 5.0 + (Math.random() - 0.5) * 4.0;
            const startZ = -3.0 + (Math.random() - 0.5) * 4.0;
            startPositions.push(startX, startY, startZ);

            delays.push(Math.random());

            colors.push(red / 255, green / 255, blue / 255);
          }
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("aStart", new THREE.Float32BufferAttribute(startPositions, 3));
    geometry.setAttribute("aDelay", new THREE.Float32BufferAttribute(delays, 1));
    geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));

    textMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uMouse: { value: new THREE.Vector3(999, 999, 0) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uMouse;
        attribute vec3 aStart;
        attribute float aDelay;
        attribute vec3 aColor;
        varying float vProgress;
        varying float vGlow;
        varying vec3 vColor;

        void main() {
          vColor = aColor;

          float p = clamp((uProgress - aDelay * 0.35) / 0.65, 0.0, 1.0);
          p = smoothstep(0.0, 1.0, p);
          vProgress = p;

          vec3 currentPos = mix(aStart, position, p);

          float noiseFreq = 3.0;
          float noiseAmp = 0.08 * (1.0 - p * 0.85);
          currentPos.x += sin(currentPos.y * noiseFreq + uTime * 2.0) * noiseAmp;
          currentPos.y += cos(currentPos.x * noiseFreq + uTime * 1.5) * noiseAmp;

          float mDist = distance(currentPos.xy, uMouse.xy);
          if (mDist < 1.0 && uProgress > 0.9) {
            float force = (1.0 - smoothstep(0.0, 1.0, mDist)) * 0.25;
            currentPos.xyz += normalize(currentPos - uMouse) * force;
          }

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pSize = mix(24.0, 4.4, p);
          gl_PointSize = pSize * (3.0 / -mvPosition.z);

          vGlow = mix(3.5, 1.5, p);
        }
      `,
      fragmentShader: `
        varying float vProgress;
        varying float vGlow;
        varying vec3 vColor;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;

          float coreAlpha = exp(-r * 3.25);
          float haloAlpha = exp(-r * 0.72) * 0.78;
          float alpha = coreAlpha + haloAlpha;

          vec3 sourceColor = pow(vColor, vec3(1.08)) * 0.86;
          vec3 bodyColor = sourceColor * 0.94;
          vec3 haloColor = sourceColor * 0.66;
          vec3 finalColor = mix(haloColor, bodyColor, coreAlpha);
          finalColor *= mix(0.95, 1.08, max(0.0, vGlow - 1.0) / 2.5);
          float globalAlpha = mix(0.18, 1.08, vProgress) * alpha;

          gl_FragColor = vec4(finalColor, globalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    textHaloMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uMouse: { value: new THREE.Vector3(999, 999, 0) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uProgress;
        uniform vec3 uMouse;
        attribute vec3 aStart;
        attribute float aDelay;
        attribute vec3 aColor;
        varying float vProgress;
        varying vec3 vColor;

        void main() {
          vColor = aColor;

          float p = clamp((uProgress - aDelay * 0.35) / 0.65, 0.0, 1.0);
          p = smoothstep(0.0, 1.0, p);
          vProgress = p;

          vec3 currentPos = mix(aStart, position, p);

          float noiseFreq = 3.0;
          float noiseAmp = 0.08 * (1.0 - p * 0.85);
          currentPos.x += sin(currentPos.y * noiseFreq + uTime * 2.0) * noiseAmp;
          currentPos.y += cos(currentPos.x * noiseFreq + uTime * 1.5) * noiseAmp;

          float mDist = distance(currentPos.xy, uMouse.xy);
          if (mDist < 1.0 && uProgress > 0.9) {
            float force = (1.0 - smoothstep(0.0, 1.0, mDist)) * 0.25;
            currentPos.xyz += normalize(currentPos - uMouse) * force;
          }

          vec4 mvPosition = modelViewMatrix * vec4(currentPos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pSize = mix(42.0, 12.0, p);
          gl_PointSize = pSize * (3.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        varying float vProgress;
        varying vec3 vColor;

        void main() {
          vec2 cxy = 2.0 * gl_PointCoord - 1.0;
          float r = dot(cxy, cxy);
          if (r > 1.0) discard;

          float halo = exp(-r * 1.18) * (1.0 - smoothstep(0.78, 1.0, r));
          vec3 sourceColor = pow(vColor, vec3(1.08)) * 0.72;
          float globalAlpha = mix(0.08, 0.34, vProgress) * halo;

          gl_FragColor = vec4(sourceColor, globalAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    textHaloPoints = new THREE.Points(geometry, textHaloMaterial);
    textPoints = new THREE.Points(geometry, textMaterial);
    scene.add(textHaloPoints);
    scene.add(textPoints);

    if (loading) loading.style.display = "none";
  }, undefined, (err) => {
    console.error("加载失败:", err);
    setLoading("未检测到 title-frame.png，请检查路径。");
  });

  const bgCount = 10000;
  const bgGeo = new THREE.BufferGeometry();
  const bgPositions = new Float32Array(bgCount * 3);
  const bgRandoms = new Float32Array(bgCount * 2);

  for (let i = 0; i < bgCount; i += 1) {
    const radius = 3.0 + Math.random() * 4.0;
    const angle = Math.random() * Math.PI * 2;

    bgPositions[i * 3] = Math.cos(angle) * radius;
    bgPositions[i * 3 + 1] = Math.sin(angle) * radius;
    bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 4.0;

    bgRandoms[i * 2] = Math.random();
    bgRandoms[i * 2 + 1] = angle;
  }
  bgGeo.setAttribute("position", new THREE.BufferAttribute(bgPositions, 3));
  bgGeo.setAttribute("aRandom", new THREE.BufferAttribute(bgRandoms, 2));

  const bgMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0xff8822) } },
    vertexShader: `
      uniform float uTime;
      attribute vec2 aRandom;
      void main() {
        vec3 pos = position;
        float speed = 0.2 + aRandom.x * 0.3;
        float currentAngle = aRandom.y + uTime * speed;
        float radius = length(pos.xy);
        pos.x = cos(currentAngle) * radius;
        pos.y = sin(currentAngle) * radius;
        pos.z += sin(uTime + aRandom.x * 10.0) * 0.5;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (2.0 + aRandom.x * 2.5) * (3.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;
        float alpha = exp(-r * 3.0) * 0.62;
        gl_FragColor = vec4(uColor * 1.2, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const bgPoints = new THREE.Points(bgGeo, bgMaterial);
  scene.add(bgPoints);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

  window.addEventListener("mousemove", (e) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersectionPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeZ, intersectionPoint);
    if (textMaterial) textMaterial.uniforms.uMouse.value.copy(intersectionPoint);
    if (textHaloMaterial) textHaloMaterial.uniforms.uMouse.value.copy(intersectionPoint);
  });

  function restartFlow() {
    params.uProgress = 0.0;
    params.targetProgress = 1.0;
  }

  restartFlow();

  const readyObserver = new MutationObserver(() => {
    if (document.body.classList.contains("is-home-ready")) {
      restartFlow();
      readyObserver.disconnect();
    }
  });
  readyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    params.uProgress += (params.targetProgress - params.uProgress) * 0.035;
    params.uTime += delta;

    if (textMaterial) {
      textMaterial.uniforms.uTime.value = params.uTime;
      textMaterial.uniforms.uProgress.value = params.uProgress;
    }
    if (textHaloMaterial) {
      textHaloMaterial.uniforms.uTime.value = params.uTime;
      textHaloMaterial.uniforms.uProgress.value = params.uProgress;
    }
    bgMaterial.uniforms.uTime.value = params.uTime;

    if (textPoints) {
      textPoints.rotation.y = Math.sin(params.uTime * 0.1) * 0.03;
      textPoints.rotation.x = Math.cos(params.uTime * 0.08) * 0.02;
    }
    if (textHaloPoints) {
      textHaloPoints.rotation.y = Math.sin(params.uTime * 0.1) * 0.03;
      textHaloPoints.rotation.x = Math.cos(params.uTime * 0.08) * 0.02;
    }

    renderer.clear(true, true, true);
    renderer.render(scene, camera);
  }

  animate();
}

initTitleParticles();
