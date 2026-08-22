import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { Vec3 } from "@/features/analysis/schemas";
import type { WorldAssets } from "@/lib/worldlabs/schemas";

import { createSyntheticWorld } from "./synthetic-world";
import {
  createMarbleColliderTransform,
  createMarbleSplatTransform,
} from "./world-transform";
import {
  buildClearanceCorridor,
  pointAtCorridorProgress,
} from "./route-visualization";
import {
  createSegmentBatch,
  segmentsBetween,
  type StraightSegment,
} from "./segment-batch";

export type InteractionMode = "inspect" | "place-start" | "place-goal";

export type SelectionEvent = {
  mode: Exclude<InteractionMode, "inspect">;
  point: Vec3;
};

export type SceneOverlay = {
  path: Vec3[];
  tone: "pass" | "fail";
  clearanceHeightMeters: number;
  clearanceWidthMeters: number;
  failureLocation?: Vec3;
};

export type SceneAnchors = {
  start: Vec3 | null;
  goal: Vec3 | null;
};

export type ColliderSceneData = {
  meshes: THREE.Mesh[];
};

export type SceneDriver = {
  mount(container: HTMLElement): void;
  loadWorld(assets: WorldAssets | null): Promise<ColliderSceneData>;
  setInteractionMode(mode: InteractionMode): void;
  setAnchors(anchors: SceneAnchors): void;
  setColliderVisible(visible: boolean): void;
  setOverlay(overlay: SceneOverlay | null): void;
  dispose(): void;
};

export type SceneDriverFactory = (options: {
  onPointSelected?: (event: SelectionEvent) => void;
}) => SceneDriver;

function disposeObject(root: THREE.Object3D): void {
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) {
      return;
    }
    object.geometry.dispose();
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    materials.forEach((material) => material.dispose());
  });
}

function createCorridorRibbon(
  stations: ReturnType<typeof buildClearanceCorridor>["stations"],
  color: number,
): THREE.Mesh {
  const positions: number[] = [];
  for (let index = 1; index < stations.length; index += 1) {
    const previous = stations[index - 1];
    const current = stations[index];
    positions.push(
      previous.left.x,
      previous.left.y,
      previous.left.z,
      previous.right.x,
      previous.right.y,
      previous.right.z,
      current.left.x,
      current.left.y,
      current.left.z,
      previous.right.x,
      previous.right.y,
      previous.right.z,
      current.right.x,
      current.right.y,
      current.right.z,
      current.left.x,
      current.left.y,
      current.left.z,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  const ribbon = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color,
      depthTest: false,
      depthWrite: false,
      opacity: 0.16,
      side: THREE.DoubleSide,
      transparent: true,
    }),
  );
  ribbon.renderOrder = 17;
  return ribbon;
}

function createFailureBeacon(overlay: SceneOverlay): THREE.Group | null {
  if (!overlay.failureLocation) {
    return null;
  }

  const beacon = new THREE.Group();
  [
    { inner: 0.22, outer: 0.3, opacity: 1 },
    { inner: 0.42, outer: 0.45, opacity: 0.72 },
  ].forEach(({ inner, outer, opacity }, index) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 40),
      new THREE.MeshBasicMaterial({
        color: 0xff5c35,
        depthTest: false,
        depthWrite: false,
        opacity,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    );
    ring.name = index === 1 ? "failure-orbit" : "failure-core";
    ring.rotation.x = -Math.PI / 2;
    ring.renderOrder = 25 + index;
    beacon.add(ring);
  });

  const crossMaterial = new THREE.MeshBasicMaterial({
    color: 0xff5c35,
    depthTest: false,
    depthWrite: false,
  });
  const crossX = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.018, 0.025),
    crossMaterial,
  );
  const crossZ = new THREE.Mesh(
    new THREE.BoxGeometry(0.025, 0.018, 0.8),
    crossMaterial.clone(),
  );
  crossX.renderOrder = 27;
  crossZ.renderOrder = 27;
  beacon.add(crossX, crossZ);

  const failureHeight = Math.min(overlay.clearanceHeightMeters, 2.2);
  const failureStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, failureHeight, 6),
    new THREE.MeshBasicMaterial({
      color: 0xff5c35,
      depthTest: false,
      depthWrite: false,
      opacity: 0.74,
      transparent: true,
    }),
  );
  failureStem.position.y = failureHeight / 2;
  failureStem.renderOrder = 27;
  const failureCap = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.14, 0),
    new THREE.MeshBasicMaterial({
      color: 0xff5c35,
      depthTest: false,
      depthWrite: false,
    }),
  );
  failureCap.position.y = failureHeight;
  failureCap.renderOrder = 28;
  beacon.add(failureStem, failureCap);
  beacon.position.set(
    overlay.failureLocation.x,
    overlay.failureLocation.y + 0.1,
    overlay.failureLocation.z,
  );
  return beacon;
}

export const createSceneController: SceneDriverFactory = ({
  onPointSelected,
}) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x11130f);
  scene.fog = new THREE.Fog(0x11130f, 22, 55);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.02, 250);
  camera.position.set(9, 7, 11);

  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.dataset.worldspecViewer = "true";

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.target.set(0, 0.8, 0);

  scene.add(new THREE.HemisphereLight(0xe8f0dd, 0x30362e, 2.4));
  const keyLight = new THREE.DirectionalLight(0xfff2cf, 2.2);
  keyLight.position.set(7, 12, 5);
  scene.add(keyLight);

  const grid = new THREE.GridHelper(40, 40, 0x596057, 0x2b2f2a);
  grid.position.y = -0.015;
  scene.add(grid);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const markers = new Map<Exclude<InteractionMode, "inspect">, THREE.Group>();
  let mode: InteractionMode = "inspect";
  let anchors: SceneAnchors = { start: null, goal: null };
  let containerElement: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let colliderRoot: THREE.Object3D | null = null;
  let colliderMeshes: THREE.Mesh[] = [];
  let splatMesh: (THREE.Object3D & { dispose(): void }) | null = null;
  let sparkRenderer: (THREE.Object3D & { dispose(): void }) | null = null;
  let routeRoot: THREE.Group | null = null;
  let routeScan: THREE.Group | null = null;
  let routeScanCorridor: ReturnType<typeof buildClearanceCorridor> | null = null;
  let routeStartedAt = 0;
  let failureMarker: THREE.Group | null = null;
  let isColliderVisible = true;
  let disposed = false;
  let loadSequence = 0;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")
    .matches ?? false;

  function resize(): void {
    if (!containerElement) {
      return;
    }
    const width = Math.max(containerElement.clientWidth, 1);
    const height = Math.max(containerElement.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function renderFrame(): void {
    controls.update();
    const now = performance.now();
    if (routeScan && routeScanCorridor && !reduceMotion) {
      const progress = ((now - routeStartedAt) % 2_800) / 2_800;
      const scanPoint = pointAtCorridorProgress(routeScanCorridor, progress);
      if (scanPoint) {
        routeScan.position.set(scanPoint.x, scanPoint.y + 0.025, scanPoint.z);
      }
      const pulse = 0.9 + Math.sin(progress * Math.PI * 2) * 0.16;
      routeScan.scale.setScalar(pulse);
    }
    if (failureMarker) {
      const pulse = reduceMotion ? 1 : 1 + Math.sin(now * 0.004) * 0.12;
      failureMarker.scale.setScalar(pulse);
      const rotatingRing = failureMarker.getObjectByName("failure-orbit");
      if (rotatingRing && !reduceMotion) {
        rotatingRing.rotation.z = now * 0.0006;
      }
    }
    renderer.render(scene, camera);
  }

  function startRendering(): void {
    if (!disposed && !document.hidden) {
      renderer.setAnimationLoop(renderFrame);
    }
  }

  function handleVisibility(): void {
    if (document.hidden) {
      renderer.setAnimationLoop(null);
    } else {
      startRendering();
    }
  }

  function clearOverlay(): void {
    if (routeRoot) {
      scene.remove(routeRoot);
      disposeObject(routeRoot);
      routeRoot = null;
      routeScan = null;
      routeScanCorridor = null;
    }
    if (failureMarker) {
      scene.remove(failureMarker);
      disposeObject(failureMarker);
      failureMarker = null;
    }
  }

  function clearWorld(): void {
    clearOverlay();
    markers.forEach((marker) => {
      scene.remove(marker);
      disposeObject(marker);
    });
    markers.clear();

    if (colliderRoot) {
      scene.remove(colliderRoot);
      disposeObject(colliderRoot);
      colliderRoot = null;
      colliderMeshes = [];
    }
    if (splatMesh) {
      scene.remove(splatMesh);
      splatMesh.dispose();
      splatMesh = null;
    }
    if (sparkRenderer) {
      scene.remove(sparkRenderer);
      sparkRenderer.dispose();
      sparkRenderer = null;
    }
  }

  function styleCollider(root: THREE.Object3D): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = [];
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }
      const previousMaterials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      previousMaterials.forEach((material) => material.dispose());
      object.material = new THREE.MeshBasicMaterial({
        color: 0xb9c7b3,
        opacity: 0.2,
        transparent: true,
        wireframe: true,
        depthWrite: false,
      });
      object.visible = isColliderVisible;
      object.userData.isWorldCollider = true;
      meshes.push(object);
    });
    return meshes;
  }

  function frameCollider(root: THREE.Object3D): void {
    const bounds = new THREE.Box3().setFromObject(root);
    if (bounds.isEmpty()) {
      return;
    }
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const radius = Math.max(size.length() * 0.55, 4);
    controls.target.copy(center);
    camera.position.copy(
      center.clone().add(new THREE.Vector3(radius, radius * 0.7, radius)),
    );
    camera.near = Math.max(radius / 1_000, 0.02);
    camera.far = Math.max(radius * 12, 100);
    camera.updateProjectionMatrix();
    controls.update();
  }

  function createMarker(
    markerMode: Exclude<InteractionMode, "inspect">,
    point: THREE.Vector3,
  ): void {
    const existing = markers.get(markerMode);
    if (existing) {
      existing.position.copy(point);
      return;
    }
    const color = markerMode === "place-start" ? 0xc7f04b : 0xf4ede0;
    const marker = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
      }),
    );
    core.position.y = 0.57;
    core.renderOrder = 24;
    marker.add(core);

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.46, 6),
      new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        depthWrite: false,
        opacity: 0.78,
        transparent: true,
      }),
    );
    stem.position.y = 0.3;
    stem.renderOrder = 23;
    marker.add(stem);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.17, 0.23, 32),
      new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        depthWrite: false,
        opacity: 0.9,
        side: THREE.DoubleSide,
        transparent: true,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.04;
    ring.renderOrder = 22;
    marker.add(ring);
    marker.position.copy(point);
    scene.add(marker);
    markers.set(markerMode, marker);
  }

  function renderAnchors(): void {
    const entries = [
      ["place-start", anchors.start],
      ["place-goal", anchors.goal],
    ] as const;
    entries.forEach(([markerMode, point]) => {
      const existing = markers.get(markerMode);
      if (!point) {
        if (existing) {
          scene.remove(existing);
          disposeObject(existing);
          markers.delete(markerMode);
        }
        return;
      }
      createMarker(markerMode, new THREE.Vector3(point.x, point.y, point.z));
    });
  }

  function handlePointer(event: PointerEvent): void {
    if (mode === "inspect" || colliderMeshes.length === 0) {
      return;
    }
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(colliderMeshes, false)[0];
    if (!hit) {
      return;
    }
    createMarker(mode, hit.point);
    onPointSelected?.({
      mode,
      point: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
    });
  }

  return {
    mount(container) {
      if (disposed) {
        throw new Error("The scene has already been disposed.");
      }
      containerElement = container;
      container.replaceChildren(renderer.domElement);
      renderer.domElement.addEventListener("pointerup", handlePointer);
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
      document.addEventListener("visibilitychange", handleVisibility);
      resize();
      startRendering();
    },

    async loadWorld(assets) {
      const thisLoad = ++loadSequence;
      clearWorld();

      if (!assets) {
        const synthetic = createSyntheticWorld();
        colliderRoot = synthetic.root;
        colliderMeshes = synthetic.meshes;
        synthetic.meshes.forEach((mesh) => {
          mesh.userData.isWorldCollider = true;
          mesh.visible = isColliderVisible;
        });
        scene.add(synthetic.root);
        renderAnchors();
        frameCollider(synthetic.root);
        return { meshes: synthetic.meshes };
      }

      const [gltf, spark] = await Promise.all([
        new GLTFLoader().loadAsync(assets.colliderGlbUrl),
        import("@sparkjsdev/spark"),
      ]);
      if (disposed || thisLoad !== loadSequence) {
        disposeObject(gltf.scene);
        return { meshes: [] };
      }

      colliderRoot = gltf.scene;
      const colliderTransform = createMarbleColliderTransform();
      colliderRoot.scale.set(
        colliderTransform.scale.x,
        colliderTransform.scale.y,
        colliderTransform.scale.z,
      );
      colliderRoot.position.set(
        colliderTransform.position.x,
        colliderTransform.position.y,
        colliderTransform.position.z,
      );
      colliderRoot.rotation.set(
        colliderTransform.rotation.x,
        colliderTransform.rotation.y,
        colliderTransform.rotation.z,
      );
      colliderRoot.updateWorldMatrix(true, true);
      colliderMeshes = styleCollider(gltf.scene);
      scene.add(gltf.scene);

      sparkRenderer = new spark.SparkRenderer({ renderer });
      scene.add(sparkRenderer);
      const loadedSplat = new spark.SplatMesh({ url: assets.splatUrl });
      const transform = createMarbleSplatTransform({
        metricScaleFactor: assets.metricScaleFactor,
        groundPlaneOffset: assets.groundPlaneOffset,
      });
      loadedSplat.scale.set(
        transform.scale.x,
        transform.scale.y,
        transform.scale.z,
      );
      loadedSplat.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z,
      );
      loadedSplat.rotation.set(
        transform.rotation.x,
        transform.rotation.y,
        transform.rotation.z,
      );
      scene.add(loadedSplat);
      splatMesh = loadedSplat;
      await loadedSplat.initialized;
      if (disposed || thisLoad !== loadSequence) {
        return { meshes: [] };
      }
      renderAnchors();
      frameCollider(gltf.scene);
      return { meshes: colliderMeshes };
    },

    setInteractionMode(nextMode) {
      mode = nextMode;
      renderer.domElement.style.cursor =
        nextMode === "inspect" ? "grab" : "crosshair";
    },

    setAnchors(nextAnchors) {
      anchors = nextAnchors;
      renderAnchors();
    },

    setColliderVisible(visible) {
      isColliderVisible = visible;
      colliderMeshes.forEach((mesh) => {
        mesh.visible = visible;
      });
    },

    setOverlay(overlay) {
      clearOverlay();
      if (!overlay) {
        return;
      }
      const color = overlay.tone === "pass" ? 0xc7f04b : 0xff5c35;
      failureMarker = createFailureBeacon(overlay);
      if (failureMarker) {
        scene.add(failureMarker);
      }
      if (overlay.path.length >= 2) {
        const corridor = buildClearanceCorridor(
          overlay.path,
          overlay.clearanceWidthMeters,
        );
        if (corridor.centerline.length < 2) {
          return;
        }
        routeRoot = new THREE.Group();
        routeRoot.add(createCorridorRibbon(corridor.stations, color));
        const routeBatches = [
          createSegmentBatch(segmentsBetween(corridor.centerline), {
            color: 0x0c0f0d,
            opacity: 0.92,
            radius: 0.048,
            renderOrder: 18,
          }),
          createSegmentBatch(segmentsBetween(corridor.centerline), {
            color,
            radius: 0.024,
            renderOrder: 19,
          }),
          createSegmentBatch(
            [
              ...segmentsBetween(corridor.leftRail),
              ...segmentsBetween(corridor.rightRail),
            ],
            {
              color,
              opacity: 0.88,
              radius: 0.012,
              renderOrder: 19,
            },
          ),
        ].filter((batch): batch is THREE.InstancedMesh => batch !== null);
        routeRoot.add(...routeBatches);

        const floorGateSegments: StraightSegment[] = corridor.gates.map(
          (gate) => ({ start: gate.left, end: gate.right }),
        );
        const floorGates = createSegmentBatch(floorGateSegments, {
          color,
          opacity: 0.72,
          radius: 0.008,
          renderOrder: 19,
        });
        if (floorGates) {
          routeRoot.add(floorGates);
        }

        const heightGateSegments: StraightSegment[] = corridor.gates
          .filter(
            (_gate, index) =>
              index % 2 === 0 || index === corridor.gates.length - 1,
          )
          .flatMap((gate) => {
            const leftTop = {
              ...gate.left,
              y: gate.left.y + overlay.clearanceHeightMeters,
            };
            const rightTop = {
              ...gate.right,
              y: gate.right.y + overlay.clearanceHeightMeters,
            };
            return [
              { start: gate.left, end: leftTop },
              { start: leftTop, end: rightTop },
              { start: rightTop, end: gate.right },
            ];
          });
        const heightGates = createSegmentBatch(heightGateSegments, {
          color,
          opacity: 0.46,
          radius: 0.007,
          renderOrder: 18,
        });
        if (heightGates) {
          routeRoot.add(heightGates);
        }

        routeScan = new THREE.Group();
        const scanCore = new THREE.Mesh(
          new THREE.SphereGeometry(0.055, 12, 8),
          new THREE.MeshBasicMaterial({
            color: 0xf8ffe3,
            depthTest: false,
            depthWrite: false,
          }),
        );
        scanCore.renderOrder = 22;
        routeScan.add(scanCore);
        const scanRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.1, 0.012, 6, 24),
          new THREE.MeshBasicMaterial({
            color,
            depthTest: false,
            depthWrite: false,
            transparent: true,
            opacity: 0.92,
          }),
        );
        scanRing.rotation.x = Math.PI / 2;
        scanRing.renderOrder = 21;
        routeScan.add(scanRing);
        routeScanCorridor = corridor;
        const initialScanPoint = pointAtCorridorProgress(
          corridor,
          reduceMotion ? 0.5 : 0,
        );
        if (initialScanPoint) {
          routeScan.position.set(
            initialScanPoint.x,
            initialScanPoint.y + 0.025,
            initialScanPoint.z,
          );
        }
        routeRoot.add(routeScan);
        routeStartedAt = performance.now();
        scene.add(routeRoot);
      }
    },

    dispose() {
      disposed = true;
      loadSequence += 1;
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener("pointerup", handlePointer);
      document.removeEventListener("visibilitychange", handleVisibility);
      resizeObserver?.disconnect();
      resizeObserver = null;
      clearWorld();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      containerElement = null;
    },
  };
};
