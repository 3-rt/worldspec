import * as THREE from "three";

export type SyntheticWorld = {
  root: THREE.Group;
  meshes: THREE.Mesh[];
};

function createBox(
  size: [number, number, number],
  position: [number, number, number],
  color: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.88,
      metalness: 0.04,
    }),
  );
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  return mesh;
}

export function createSyntheticWorld(): SyntheticWorld {
  const root = new THREE.Group();
  root.name = "WorldSpec synthetic threshold world";

  const meshes = [
    createBox([12, 0.2, 8], [0, -0.1, 0], 0x4b514b),
    createBox([2.4, 0.3, 2.4], [4.1, 0.15, 0], 0x6b7567),
    createBox([0.35, 2.6, 3.1], [0, 1.3, -2.45], 0x313632),
    createBox([0.35, 2.6, 3.1], [0, 1.3, 2.45], 0x313632),
    createBox([3.4, 1.1, 0.3], [-3.5, 0.55, -1.4], 0x596057),
    createBox([3.4, 1.1, 0.3], [-3.5, 0.55, 1.4], 0x596057),
  ];

  root.add(...meshes);
  return { root, meshes };
}
