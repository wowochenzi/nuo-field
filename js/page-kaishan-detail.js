const canvas = document.getElementById("kaishanDetailCanvas");
const panel = document.querySelector(".kaishan-model-panel");
const kaishanMask = (window.NuoData?.maskData || []).find((mask) => mask.id === "guizhou-kaishan-mangjiang");

function assetPath(path) {
  return window.NuoRouter?.asset ? window.NuoRouter.asset(path) : `../${path}`;
}

async function loadThreeDeps() {
  const THREE = await import("three");
  const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
  return { THREE, GLTFLoader };
}

function normalizeObject(THREE, object) {
  const box = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);
  object.position.sub(center);
  const maxAxis = Math.max(size.x, size.y, size.z, 0.001);
  object.scale.multiplyScalar(3.68 / maxAxis);
}

function ensureGeometryAttributes(THREE, geometry) {
  if (!geometry.attributes.uv) {
    geometry.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
  }
  if (!geometry.attributes.normal) geometry.computeVertexNormals();

  const count = geometry.attributes.position.count;
  const randoms = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count * 3; i += 1) randoms[i] = (Math.random() - 0.5) * 5.2;
  for (let i = 0; i < count; i += 1) seeds[i] = Math.random();
  geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
}

function makeParticleMaterial(THREE, map, color) {
  if (map) {
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;
  }

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPointSize: { value: 1.68 },
      uTexture: { value: map || null },
      uHasTexture: { value: map ? 1.0 : 0.0 },
      uColor: { value: color || new THREE.Color(0xd66a36) },
      uFade: { value: 1.18 },
      uGlowScale: { value: 1.42 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uPointSize;

      attribute vec3 aRandom;
      attribute float aSeed;
      varying vec2 vUv;
      varying float vSeed;

      void main() {
        vUv = uv;
        vSeed = aSeed;
        vec3 pos = position;
        pos += normal * (sin(uTime * 0.72 + aSeed * 18.0) * 0.012);
        pos += aRandom * 0.006 * sin(uTime * 0.36 + aSeed * 12.0);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        float grainSize = mix(1.05, 1.72, aSeed);
        gl_PointSize = min(uPointSize * grainSize * (4.2 / -mvPosition.z), 13.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      uniform float uHasTexture;
      uniform vec3 uColor;
      uniform float uFade;
      uniform float uGlowScale;

      varying vec2 vUv;
      varying float vSeed;

      float random(float n) {
        return fract(sin(n * 437.143) * 43758.5453123);
      }

      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;

        float alpha = 1.0 - smoothstep(0.46, 1.0, r);
        vec3 color = uColor;
        if (uHasTexture > 0.5) color = texture2D(uTexture, vUv).rgb;

        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        float blackMass = 1.0 - smoothstep(0.035, 0.22, luminance);
        float grain = 0.88 + random(vSeed) * 0.5;
        float core = exp(-r * mix(4.8, 2.1, random(vSeed + 3.0)));

        vec3 lit = color * (2.15 * uGlowScale) * grain;
        lit += color * exp(-r * 0.86) * 1.12 * uGlowScale;

        vec3 visibleBlack = max(color * 1.08, vec3(0.14, 0.075, 0.045));
        visibleBlack += vec3(0.78, 0.18, 0.055) * exp(-r * 1.55) * 0.44 * uGlowScale;
        color = mix(lit, visibleBlack, blackMass * 0.72);
        color = min(color, vec3(2.35));

        alpha = max(alpha * core, blackMass * 0.9);
        gl_FragColor = vec4(color, alpha * uFade);
      }
    `,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    alphaTest: 0.028,
    blending: THREE.NormalBlending
  });
  material.userData.isMaskParticle = true;
  return material;
}

function convertMeshToParticles(THREE, mesh, materialsToUpdate) {
  const sourceGeometry = mesh.geometry;
  if (!sourceGeometry?.attributes?.position) return;

  const geometry = sourceGeometry.index ? sourceGeometry.toNonIndexed() : sourceGeometry.clone();
  ensureGeometryAttributes(THREE, geometry);

  const sourceMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
  const map = sourceMaterial?.map || null;
  const color = sourceMaterial?.color ? sourceMaterial.color.clone() : new THREE.Color(0xd66a36);
  const particleMaterial = makeParticleMaterial(THREE, map, color);
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
  const occluderMesh = new THREE.Mesh(sourceGeometry, occluderMaterial);
  occluderMesh.position.copy(mesh.position);
  occluderMesh.rotation.copy(mesh.rotation);
  occluderMesh.scale.copy(mesh.scale).multiplyScalar(0.995);

  mesh.parent.remove(mesh);
  mesh.parent.add(points);
  mesh.parent.add(occluderMesh);
}

function createMaskObject(THREE, gltf, materialsToUpdate) {
  const root = new THREE.Group();
  gltf.scene.rotation.set(0, -Math.PI / 2, 0);

  const meshes = [];
  gltf.scene.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });
  meshes.forEach((mesh) => convertMeshToParticles(THREE, mesh, materialsToUpdate));

  root.add(gltf.scene);
  normalizeObject(THREE, root);
  return root;
}

function createHaloSystem(THREE) {
  const count = 1200;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const ring = i < count * 0.54;
    const theta = Math.random() * Math.PI * 2;
    const radius = ring ? 1.92 + (Math.random() - 0.5) * 0.08 : Math.sqrt(Math.random()) * 2.08;
    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = Math.sin(theta) * radius * 1.08 + 0.08;
    positions[i * 3 + 2] = -0.16 + (Math.random() - 0.5) * 0.08;
    seeds[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(0xff3b18) }
    },
    vertexShader: `
      uniform float uTime;
      attribute float aSeed;
      varying float vAlpha;

      void main() {
        vec3 pos = position;
        float angle = uTime * 0.07 + aSeed * 6.28318;
        pos.x += sin(angle) * 0.022;
        pos.y += cos(angle * 1.2) * 0.018;
        vAlpha = 0.08 + aSeed * 0.34;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = (0.62 + aSeed * 1.1) * (4.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vAlpha;

      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;
        gl_FragColor = vec4(uColor * 1.7, exp(-r * 3.0) * vAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  material.userData.isHaloParticle = true;
  return new THREE.Points(geometry, material);
}

async function initKaishanDetail() {
  if (!canvas || !panel || !kaishanMask) return;

  const { THREE, GLTFLoader } = await loadThreeDeps();
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
  camera.position.set(0, 0, 8);
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

  scene.add(new THREE.AmbientLight(0xfff1cf, 1.05));

  const group = new THREE.Group();
  group.position.set(-0.16, -0.08, 0);
  scene.add(group);

  const materials = [];
  const halo = createHaloSystem(THREE);
  halo.position.set(-0.16, 0.03, -0.2);
  scene.add(halo);

  try {
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load(assetPath(kaishanMask.model), resolve, undefined, reject);
    });
    group.add(createMaskObject(THREE, gltf, materials));
  } catch (error) {
    console.warn("开山莽将 GLB 模型加载失败，详情页不显示 PNG 兜底图。", error);
  }

  function resize() {
    const rect = panel.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.55);
    const aspect = rect.width / Math.max(1, rect.height);
    const viewHeight = 4.24;
    const viewWidth = viewHeight * aspect;
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);
    camera.left = -viewWidth / 2;
    camera.right = viewWidth / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const t = clock.getElapsedTime();

    group.rotation.y = Math.sin(t * 0.2) * (Math.PI / 12);
    group.rotation.z = Math.sin(t * 0.18) * 0.012;
    group.scale.setScalar(1 + Math.sin(t * 0.34) * 0.012);

    materials.forEach((material) => {
      material.uniforms.uTime.value += delta;
      material.uniforms.uGlowScale.value = 1.42 + Math.sin(t * 0.32) * 0.08;
    });
    halo.material.uniforms.uTime.value = t;
    halo.rotation.z = Math.sin(t * 0.12) * 0.04;

    renderer.render(scene, camera);
  }

  resize();
  window.addEventListener("resize", resize);
  animate();
}

initKaishanDetail();
