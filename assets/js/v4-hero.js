import * as THREE from "./vendor/three.module.min.js";

const canvas = document.getElementById("hero3dCanvas");
const host = canvas?.closest(".hero-3d");
const hero = canvas?.closest(".hero");

if (canvas && host && hero) {
  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    const startedAt = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const root = new THREE.Group();
    const pointer = new THREE.Vector2();
    let active = true;
    let frame = 0;
    let cameraBaseX = 0.9;
    let cameraBaseY = 0.65;
    let cameraBaseZ = 11.2;
    let cameraLookX = 1.2;

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    scene.add(root);

    const ambient = new THREE.AmbientLight(0x91acd3, 1.35);
    const key = new THREE.DirectionalLight(0xffe8a7, 3.2);
    key.position.set(4, 8, 6);
    const rim = new THREE.PointLight(0x477bc5, 36, 18);
    rim.position.set(-4, 1, 4);
    scene.add(ambient, key, rim);

    const clusterMaterial = new THREE.MeshStandardMaterial({
      color: 0x17386f,
      emissive: 0x071a36,
      emissiveIntensity: 0.56,
      metalness: 0.72,
      roughness: 0.28,
      transparent: true,
      opacity: 0.9
    });
    const edgeBlue = new THREE.LineBasicMaterial({ color: 0x739bd3, transparent: true, opacity: 0.56 });
    const edgeGold = new THREE.LineBasicMaterial({ color: 0xe8d38a, transparent: true, opacity: 0.95 });
    const networkLine = new THREE.LineBasicMaterial({ color: 0x8eadd3, transparent: true, opacity: 0.34 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xe0c66f, emissive: 0x9b7720, emissiveIntensity: 1.25, metalness: 0.62, roughness: 0.2 });
    const glowGold = new THREE.MeshBasicMaterial({
      color: 0xd8bd68,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xe4cf8a });
    const nodeGeometry = new THREE.OctahedronGeometry(0.065, 0);
    const flowNodes = [];
    const flowBands = [];

    const leftPoints = [];
    const rightPoints = [];

    function addCompanyCluster(originX, side, points) {
      const layout = [
        [-1.35, -0.35, 1.5], [-0.72, 0.18, 2.2], [0.02, -0.22, 1.72],
        [0.76, 0.34, 2.65], [1.35, -0.12, 1.92], [-0.22, 0.76, 1.32]
      ];

      layout.forEach((item, index) => {
        const width = 0.42 + (index % 2) * 0.09;
        const depth = 0.42 + ((index + 1) % 2) * 0.08;
        const height = item[2];
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const building = new THREE.Mesh(geometry, clusterMaterial);
        building.position.set(originX + item[0], -2.25 + height / 2, item[1]);
        building.rotation.y = side * (0.08 + index * 0.025);
        root.add(building);

        const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), index === 3 ? edgeGold : edgeBlue);
        edges.position.copy(building.position);
        edges.rotation.copy(building.rotation);
        root.add(edges);

        const point = new THREE.Vector3(building.position.x, building.position.y + height / 2 + 0.12, building.position.z);
        points.push(point);
        const node = new THREE.Mesh(nodeGeometry, index === 3 ? gold : nodeMaterial);
        node.position.copy(point);
        root.add(node);
      });
    }

    addCompanyCluster(-2.2, -1, leftPoints);
    addCompanyCluster(2.7, 1, rightPoints);

    function connectCluster(points) {
      for (let index = 0; index < points.length - 1; index += 1) {
        const geometry = new THREE.BufferGeometry().setFromPoints([points[index], points[index + 1]]);
        root.add(new THREE.Line(geometry, networkLine));
      }
      const cross = new THREE.BufferGeometry().setFromPoints([points[0], points[3], points[5], points[1]]);
      root.add(new THREE.Line(cross, networkLine));
    }

    connectCluster(leftPoints);
    connectCluster(rightPoints);

    const coreAnchor = new THREE.Vector3(1.82, 0.34, 0.28);
    const bridgeCurve = new THREE.CatmullRomCurve3([
      leftPoints[3].clone(),
      new THREE.Vector3(-0.65, 1.18, 0.35),
      coreAnchor.clone(),
      rightPoints[3].clone()
    ]);
    const bridgeGlow = new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 96, 0.15, 12, false), glowGold);
    const bridge = new THREE.Mesh(new THREE.TubeGeometry(bridgeCurve, 96, 0.052, 12, false), gold);
    root.add(bridgeGlow, bridge);
    flowBands.push({ mesh: bridgeGlow, phase: 0.3, amount: 0.045 }, { mesh: bridge, phase: 0.3, amount: 0.045 });

    const upperFlowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.3, -1.45, 0.9),
      new THREE.Vector3(-2.45, 1.55, 0.35),
      new THREE.Vector3(0.1, 2.18, -0.65),
      new THREE.Vector3(2.75, 1.35, 0.2),
      new THREE.Vector3(4.55, -0.5, -0.15)
    ]);
    const lowerFlowCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-3.8, -1.95, -0.55),
      new THREE.Vector3(-1.6, -0.75, 0.6),
      new THREE.Vector3(0.4, 0.18, -0.3),
      new THREE.Vector3(2.4, 0.35, 0.65),
      new THREE.Vector3(4.2, -1.45, 0.2)
    ]);

    [upperFlowCurve, lowerFlowCurve].forEach((curve, index) => {
      const glow = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, index ? 0.095 : 0.12, 10, false), glowGold.clone());
      glow.material.opacity = index ? 0.075 : 0.095;
      const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, index ? 0.014 : 0.022, 8, false), gold.clone());
      line.material.transparent = true;
      line.material.opacity = index ? 0.58 : 0.74;
      root.add(glow, line);
      flowBands.push(
        { mesh: glow, phase: index * 1.7, amount: index ? 0.07 : 0.1 },
        { mesh: line, phase: index * 1.7, amount: index ? 0.07 : 0.1 }
      );
    });

    const transferNode = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), gold);
    root.add(transferNode);

    [bridgeCurve, upperFlowCurve, lowerFlowCurve].forEach((curve, curveIndex) => {
      const count = curveIndex === 0 ? 4 : 3;
      for (let index = 0; index < count; index += 1) {
        const orb = new THREE.Mesh(
          new THREE.SphereGeometry(curveIndex === 0 ? 0.07 : 0.045, 12, 12),
          new THREE.MeshBasicMaterial({
            color: curveIndex === 2 ? 0x90b9e8 : 0xf2dc8e,
            transparent: true,
            opacity: curveIndex === 0 ? 0.92 : 0.7
          })
        );
        root.add(orb);
        flowNodes.push({
          mesh: orb,
          curve,
          phase: index / count + curveIndex * 0.17,
          speed: 0.062 + curveIndex * 0.016
        });
      }
    });

    const mergerCore = new THREE.Group();
    mergerCore.position.copy(coreAnchor);

    const coreParticleCount = 2200;
    const coreParticleRadius = 1.95;
    const coreParticlePositions = new Float32Array(coreParticleCount * 3);
    const coreParticleColorsA = new Float32Array(coreParticleCount * 3);
    const coreParticleColorsB = new Float32Array(coreParticleCount * 3);
    const coreParticleSizes = new Float32Array(coreParticleCount);
    const coreParticleAlphas = new Float32Array(coreParticleCount);
    const coreParticlePhases = new Float32Array(coreParticleCount);
    const globeColors = {
      green: new THREE.Color(0x4ade80),
      teal: new THREE.Color(0x22d3ee),
      violet: new THREE.Color(0xa78bfa),
      pink: new THREE.Color(0xf472b6),
      orange: new THREE.Color(0xff6a00),
      magenta: new THREE.Color(0xec4899)
    };

    for (let index = 0; index < coreParticleCount; index += 1) {
      const phi = Math.acos(1 - 2 * (index + 0.5) / coreParticleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const sinPhi = Math.sin(phi);
      coreParticlePositions[index * 3] = coreParticleRadius * sinPhi * Math.cos(theta);
      coreParticlePositions[index * 3 + 1] = coreParticleRadius * sinPhi * Math.sin(theta);
      coreParticlePositions[index * 3 + 2] = coreParticleRadius * Math.cos(phi);
      const latitude = phi / Math.PI;
      const colorA = new THREE.Color();
      const colorB = new THREE.Color();
      if (latitude < 0.25) {
        colorA.lerpColors(globeColors.green, globeColors.teal, latitude / 0.25);
        colorB.lerpColors(globeColors.teal, globeColors.violet, latitude / 0.25);
      } else if (latitude < 0.5) {
        colorA.lerpColors(globeColors.teal, globeColors.violet, (latitude - 0.25) / 0.25);
        colorB.lerpColors(globeColors.violet, globeColors.pink, (latitude - 0.25) / 0.25);
      } else if (latitude < 0.75) {
        colorA.lerpColors(globeColors.violet, globeColors.pink, (latitude - 0.5) / 0.25);
        colorB.lerpColors(globeColors.pink, globeColors.magenta, (latitude - 0.5) / 0.25);
      } else {
        colorA.lerpColors(globeColors.pink, globeColors.magenta, (latitude - 0.75) / 0.25);
        colorB.lerpColors(globeColors.magenta, globeColors.orange, (latitude - 0.75) / 0.25);
      }
      if (Math.random() < 0.08) {
        colorA.copy(globeColors.orange);
        colorB.lerpColors(globeColors.orange, globeColors.pink, 0.4);
      }
      const brightness = 0.88 + Math.random() * 0.24;
      coreParticleColorsA[index * 3] = Math.min(colorA.r * brightness, 1);
      coreParticleColorsA[index * 3 + 1] = Math.min(colorA.g * brightness, 1);
      coreParticleColorsA[index * 3 + 2] = Math.min(colorA.b * brightness, 1);
      coreParticleColorsB[index * 3] = Math.min(colorB.r * brightness, 1);
      coreParticleColorsB[index * 3 + 1] = Math.min(colorB.g * brightness, 1);
      coreParticleColorsB[index * 3 + 2] = Math.min(colorB.b * brightness, 1);
      coreParticleSizes[index] = 0.4 + Math.random() * 0.55;
      coreParticleAlphas[index] = 0.3 + Math.random() * 0.45;
      coreParticlePhases[index] = Math.random() * Math.PI * 2;
    }

    const coreParticleGeometry = new THREE.BufferGeometry();
    coreParticleGeometry.setAttribute("position", new THREE.BufferAttribute(coreParticlePositions, 3));
    coreParticleGeometry.setAttribute("colorA", new THREE.BufferAttribute(coreParticleColorsA, 3));
    coreParticleGeometry.setAttribute("colorB", new THREE.BufferAttribute(coreParticleColorsB, 3));
    coreParticleGeometry.setAttribute("size", new THREE.BufferAttribute(coreParticleSizes, 1));
    coreParticleGeometry.setAttribute("alpha", new THREE.BufferAttribute(coreParticleAlphas, 1));
    coreParticleGeometry.setAttribute("phase", new THREE.BufferAttribute(coreParticlePhases, 1));
    const coreParticleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.6) },
        uMouse2D: { value: new THREE.Vector2(0, 0) },
        uPullStrength: { value: 0.3 }
      },
      vertexShader: `
        attribute vec3 colorA;
        attribute vec3 colorB;
        attribute float size;
        attribute float alpha;
        attribute float phase;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        uniform vec2 uMouse2D;
        uniform float uPullStrength;
        void main() {
          float pulse = sin(uTime * 0.8 + phase) * 0.04 + 1.0;
          vec3 pos = position * pulse;
          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          float depth = -mvPos.z;
          float facing = clamp(1.0 - (depth - 4.0) / 8.0, 0.0, 1.0);
          float colorMix = sin(uTime * 0.4 + phase * 0.5) * 0.5 + 0.5;
          vColor = mix(colorA, colorB, colorMix);
          vAlpha = alpha * (0.3 + facing * 0.7);
          gl_PointSize = size * uPixelRatio * (40.0 / depth) * (0.6 + facing * 0.4);
          vec4 projected = projectionMatrix * mvPos;
          vec2 screenPos = projected.xy / projected.w;
          vec2 toMouse = uMouse2D - screenPos;
          float distanceToMouse = length(toMouse);
          float pull = exp(-distanceToMouse * 1.8) * uPullStrength * facing;
          projected.xy += toMouse * pull * projected.w;
          gl_Position = projected;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          float distanceToCenter = length(gl_PointCoord - vec2(0.5));
          if (distanceToCenter > 0.5) discard;
          float edge = 1.0 - smoothstep(0.2, 0.5, distanceToCenter);
          gl_FragColor = vec4(vColor, vAlpha * edge);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending
    });
    const coreParticles = new THREE.Points(coreParticleGeometry, coreParticleMaterial);

    const coreNetworkIndexes = new Set();
    while (coreNetworkIndexes.size < 180) coreNetworkIndexes.add(Math.floor(Math.random() * coreParticleCount));
    const networkIndexes = [...coreNetworkIndexes];
    const coreNetworkPairs = [];
    for (let left = 0; left < networkIndexes.length; left += 1) {
      const leftIndex = networkIndexes[left];
      const ax = coreParticlePositions[leftIndex * 3];
      const ay = coreParticlePositions[leftIndex * 3 + 1];
      const az = coreParticlePositions[leftIndex * 3 + 2];
      for (let right = left + 1; right < networkIndexes.length; right += 1) {
        const rightIndex = networkIndexes[right];
        const bx = coreParticlePositions[rightIndex * 3];
        const by = coreParticlePositions[rightIndex * 3 + 1];
        const bz = coreParticlePositions[rightIndex * 3 + 2];
        const distance = Math.hypot(ax - bx, ay - by, az - bz);
        if (distance < 1.1) coreNetworkPairs.push(leftIndex, rightIndex);
      }
    }
    const coreNetworkPositions = new Float32Array(coreNetworkPairs.length * 3);
    const coreNetworkColors = new Float32Array(coreNetworkPairs.length * 3);
    for (let index = 0; index < coreNetworkPairs.length; index += 1) {
      const particleIndex = coreNetworkPairs[index];
      coreNetworkPositions[index * 3] = coreParticlePositions[particleIndex * 3];
      coreNetworkPositions[index * 3 + 1] = coreParticlePositions[particleIndex * 3 + 1];
      coreNetworkPositions[index * 3 + 2] = coreParticlePositions[particleIndex * 3 + 2];
      coreNetworkColors[index * 3] = coreParticleColorsA[particleIndex * 3];
      coreNetworkColors[index * 3 + 1] = coreParticleColorsA[particleIndex * 3 + 1];
      coreNetworkColors[index * 3 + 2] = coreParticleColorsA[particleIndex * 3 + 2];
    }
    const coreNetworkGeometry = new THREE.BufferGeometry();
    coreNetworkGeometry.setAttribute("position", new THREE.BufferAttribute(coreNetworkPositions, 3));
    coreNetworkGeometry.setAttribute("color", new THREE.BufferAttribute(coreNetworkColors, 3));
    const coreNetworkMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending
    });
    const coreNetwork = new THREE.LineSegments(
      coreNetworkGeometry,
      coreNetworkMaterial
    );

    const coreDustCount = 500;
    const coreDustPositions = new Float32Array(coreDustCount * 3);
    const coreDustColorsA = new Float32Array(coreDustCount * 3);
    const coreDustColorsB = new Float32Array(coreDustCount * 3);
    const coreDustSizes = new Float32Array(coreDustCount);
    const coreDustAlphas = new Float32Array(coreDustCount);
    const coreDustPhases = new Float32Array(coreDustCount);
    for (let index = 0; index < coreDustCount; index += 1) {
      const radius = coreParticleRadius * (1.08 + Math.random() * 0.55);
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      coreDustPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      coreDustPositions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      coreDustPositions[index * 3 + 2] = radius * Math.cos(phi);
      const colorMix = Math.random();
      const colorA = new THREE.Color().lerpColors(globeColors.violet, globeColors.pink, colorMix);
      const colorB = new THREE.Color().lerpColors(globeColors.pink, globeColors.orange, colorMix);
      coreDustColorsA.set([colorA.r, colorA.g, colorA.b], index * 3);
      coreDustColorsB.set([colorB.r, colorB.g, colorB.b], index * 3);
      coreDustSizes[index] = 0.18 + Math.random() * 0.38;
      coreDustAlphas[index] = 0.08 + Math.random() * 0.18;
      coreDustPhases[index] = Math.random() * Math.PI * 2;
    }
    const coreDustGeometry = new THREE.BufferGeometry();
    coreDustGeometry.setAttribute("position", new THREE.BufferAttribute(coreDustPositions, 3));
    coreDustGeometry.setAttribute("colorA", new THREE.BufferAttribute(coreDustColorsA, 3));
    coreDustGeometry.setAttribute("colorB", new THREE.BufferAttribute(coreDustColorsB, 3));
    coreDustGeometry.setAttribute("size", new THREE.BufferAttribute(coreDustSizes, 1));
    coreDustGeometry.setAttribute("alpha", new THREE.BufferAttribute(coreDustAlphas, 1));
    coreDustGeometry.setAttribute("phase", new THREE.BufferAttribute(coreDustPhases, 1));
    const coreDust = new THREE.Points(coreDustGeometry, coreParticleMaterial);

    const coreParticleGroup = new THREE.Group();
    coreParticleGroup.add(coreParticles, coreNetwork);
    mergerCore.add(coreParticleGroup, coreDust);

    root.add(mergerCore);

    const grid = new THREE.GridHelper(18, 22, 0xb99c45, 0x29466e);
    grid.position.y = -2.27;
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    root.add(grid);

    const dustGeometry = new THREE.BufferGeometry();
    const dust = [];
    for (let index = 0; index < 180; index += 1) {
      dust.push((Math.random() - 0.5) * 12, Math.random() * 5 - 2.3, (Math.random() - 0.5) * 5);
    }
    dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dust, 3));
    const dustPoints = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xb8c9df, size: 0.024, transparent: true, opacity: 0.5 }));
    root.add(dustPoints);

    function resize() {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
      coreParticleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 1.6);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      cameraBaseX = width < 760 ? 1.7 : 0.9;
      cameraBaseY = width < 760 ? 1.1 : 0.65;
      cameraBaseZ = width < 760 ? 13.8 : 11.2;
      cameraLookX = width < 760 ? 1.7 : 1.2;
      camera.position.set(cameraBaseX, cameraBaseY, cameraBaseZ);
      camera.lookAt(cameraLookX, -0.35, 0);
      camera.updateProjectionMatrix();
      root.position.x = width < 760 ? 1.5 : 2.3;
      root.scale.setScalar(width < 760 ? 0.82 : 1);
    }

    function render() {
      const elapsed = (performance.now() - startedAt) / 1000;
      const progress = reducedMotion ? 0.46 : (elapsed * 0.105) % 1;
      transferNode.position.copy(bridgeCurve.getPointAt(progress));
      transferNode.scale.setScalar(0.82 + Math.sin(elapsed * 4) * 0.16);
      flowNodes.forEach((item, index) => {
        const point = reducedMotion ? item.phase % 1 : (item.phase + elapsed * item.speed) % 1;
        item.mesh.position.copy(item.curve.getPointAt(point));
        item.mesh.scale.setScalar(0.75 + Math.sin(elapsed * 3.2 + index) * 0.22);
        item.mesh.material.opacity = 0.58 + Math.sin(elapsed * 2.4 + index * 0.8) * 0.28;
      });
      flowBands.forEach((item) => {
        item.mesh.position.y = Math.sin(elapsed * 0.55 + item.phase) * item.amount;
        item.mesh.rotation.z = Math.sin(elapsed * 0.34 + item.phase) * item.amount * 0.18;
      });
      coreParticleMaterial.uniforms.uTime.value = elapsed;
      coreParticleMaterial.uniforms.uMouse2D.value.lerp(pointer, 0.08);
      for (let index = 0; index < coreNetworkPairs.length; index += 1) {
        const particleIndex = coreNetworkPairs[index];
        const pulse = Math.sin(elapsed * 0.8 + coreParticlePhases[particleIndex]) * 0.04 + 1;
        coreNetworkPositions[index * 3] = coreParticlePositions[particleIndex * 3] * pulse;
        coreNetworkPositions[index * 3 + 1] = coreParticlePositions[particleIndex * 3 + 1] * pulse;
        coreNetworkPositions[index * 3 + 2] = coreParticlePositions[particleIndex * 3 + 2] * pulse;
      }
      coreNetworkGeometry.attributes.position.needsUpdate = true;
      coreNetworkMaterial.opacity = 0.18 + Math.sin(elapsed * 0.5) * 0.08;
      coreParticleGroup.rotation.y = elapsed * 0.18;
      coreParticleGroup.rotation.x = Math.sin(elapsed * 0.1) * 0.12;
      coreDust.rotation.y = elapsed * 0.12;
      coreDust.rotation.x = Math.sin(elapsed * 0.08) * 0.1;
      mergerCore.position.copy(coreAnchor);
      mergerCore.scale.setScalar(0.72);
      bridgeGlow.material.opacity = 0.1 + Math.sin(elapsed * 1.15) * 0.035;
      dustPoints.rotation.y = elapsed * 0.036;
      dustPoints.rotation.x = Math.sin(elapsed * 0.28) * 0.045;
      const targetY = pointer.x * 0.115 + Math.sin(elapsed * 0.24) * 0.065;
      const targetX = -pointer.y * 0.065 + Math.cos(elapsed * 0.2) * 0.034;
      root.rotation.y += (targetY - root.rotation.y) * 0.035;
      root.rotation.x += (targetX - root.rotation.x) * 0.035;
      camera.position.x = cameraBaseX + Math.sin(elapsed * 0.22) * 0.22;
      camera.position.y = cameraBaseY + Math.cos(elapsed * 0.27) * 0.1;
      camera.position.z = cameraBaseZ + Math.sin(elapsed * 0.16) * 0.16;
      camera.lookAt(cameraLookX + Math.sin(elapsed * 0.19) * 0.08, -0.35 + Math.cos(elapsed * 0.21) * 0.05, 0);
      renderer.render(scene, camera);
      if (active && !reducedMotion) frame = window.requestAnimationFrame(render);
    }

    function onPointerMove(event) {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
    }

    const observer = new IntersectionObserver((entries) => {
      active = entries[0]?.isIntersecting ?? true;
      if (active && !reducedMotion && !frame) frame = window.requestAnimationFrame(render);
      if (!active && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }, { threshold: 0.02 });

    resize();
    host.classList.add("is-ready");
    render();
    observer.observe(hero);
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
  } catch (error) {
    host.classList.add("is-fallback");
  }
}
