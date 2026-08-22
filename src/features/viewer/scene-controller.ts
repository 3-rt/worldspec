import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type { Vec3 } from "@/features/analysis/schemas";
import type { WorldAssets } from "@/lib/worldlabs/schemas";

import { createSyntheticWorld } from "./synthetic-world";
import { createMarbleSplatTransform } from "./world-transform";

export type InteractionMode = "inspect" | "place-start" | "place-goal";

export type SelectionEvent = {
  mode: Exclude<InteractionMode, "inspect">;
  point: Vec3;
};

export type SceneOverlay = {
  path: Vec3[];
  tone: "pass" | "fail";
  failureLocation?: Vec3;
};

export type ColliderSceneData = {
  meshes: THREE.Mesh[];
};

export type SceneDriver = {
  mount(container: HTMLElement): void;
  loadWorld(assets: WorldAssets | null): Promise<ColliderSceneData>;
  setInteractionMode(mode: InteractionMode): void;
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
  const markers = new Map<Exclude<InteractionMode, "inspect">, THREE.Mesh>();
  let mode: InteractionMode = "inspect";
  let containerElement: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let colliderRoot: THREE.Object3D | null = null;
  let colliderMeshes: THREE.Mesh[] = [];
  let splatMesh: (THREE.Object3D & { dispose(): void }) | null = null;
  let sparkRenderer: (THREE.Object3D & { dispose(): void }) | null = null;
  let routeLine: THREE.Line | null = null;
  let failureMarker: THREE.Mesh | null = null;
  let isColliderVisible = true;
  let disposed = false;
  let loadSequence = 0;

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
    if (routeLine) {
      scene.remove(routeLine);
      routeLine.geometry.dispose();
      (routeLine.material as THREE.Material).dispose();
      routeLine = null;
    }
    if (failureMarker) {
      scene.remove(failureMarker);
      failureMarker.geometry.dispose();
      (failureMarker.material as THREE.Material).dispose();
      failureMarker = null;
    }
  }

  function clearWorld(): void {
    clearOverlay();
    markers.forEach((marker) => {
      scene.remove(marker);
      marker.geometry.dispose();
      (marker.material as THREE.Material).dispose();
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
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 20, 12),
      new THREE.MeshBasicMaterial({
        color: markerMode === "place-start" ? 0xc7f04b : 0xf4ede0,
        depthTest: false,
      }),
    );
    marker.renderOrder = 20;
    marker.position.copy(point);
    scene.add(marker);
    markers.set(markerMode, marker);
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
      frameCollider(gltf.scene);
      return { meshes: colliderMeshes };
    },

    setInteractionMode(nextMode) {
      mode = nextMode;
      renderer.domElement.style.cursor =
        nextMode === "inspect" ? "grab" : "crosshair";
    },

    setColliderVisible(visible) {
      isColliderVisible = visible;
      colliderMeshes.forEach((mesh) => {
        mesh.visible = visible;
      });
    },

    setOverlay(overlay) {
      clearOverlay();
      if (!overlay || overlay.path.length < 2) {
        return;
      }
      const color = overlay.tone === "pass" ? 0xc7f04b : 0xff5c35;
      routeLine = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(
          overlay.path.map(
            (point) => new THREE.Vector3(point.x, point.y + 0.08, point.z),
          ),
        ),
        new THREE.LineBasicMaterial({
          color,
          depthTest: false,
          transparent: true,
          opacity: 0.96,
        }),
      );
      routeLine.renderOrder = 18;
      scene.add(routeLine);

      if (overlay.failureLocation) {
        failureMarker = new THREE.Mesh(
          new THREE.RingGeometry(0.22, 0.34, 32),
          new THREE.MeshBasicMaterial({
            color: 0xff5c35,
            depthTest: false,
            side: THREE.DoubleSide,
          }),
        );
        failureMarker.rotation.x = -Math.PI / 2;
        failureMarker.position.set(
          overlay.failureLocation.x,
          overlay.failureLocation.y + 0.09,
          overlay.failureLocation.z,
        );
        failureMarker.renderOrder = 19;
        scene.add(failureMarker);
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
