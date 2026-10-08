import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const buddyLoader = new GLTFLoader();

export async function loadBuddyGltf(url: string) {
  return buddyLoader.loadAsync(url);
}

export interface ProceduralBuddy {
  group: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  materialColors: Map<THREE.Material, THREE.Color>;
}

export function createProceduralBuddy(): ProceduralBuddy {
  const cat = new THREE.Group();
  cat.name = 'getingo-procedural-buddy';
  const materialColors = new Map<THREE.Material, THREE.Color>();
  const fur = new THREE.MeshPhysicalMaterial({ color: 0xb9d8ff, roughness: .72, clearcoat: .12 });
  const furLight = new THREE.MeshPhysicalMaterial({ color: 0xe9f5ff, roughness: .78, clearcoat: .08 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17233d, roughness: .48 });
  const accent = new THREE.MeshStandardMaterial({ color: 0x2d8cff, emissive: 0x0d4d9c, emissiveIntensity: .4, roughness: .35 });
  [fur, furLight, dark, accent].forEach(material => materialColors.set(material, material.color.clone()));

  const body = new THREE.Mesh(new THREE.SphereGeometry(.72, 36, 28), fur);
  body.scale.set(.88, 1.08, .78);
  body.position.y = .92;
  body.castShadow = true;
  const chest = new THREE.Mesh(new THREE.SphereGeometry(.43, 28, 22), furLight);
  chest.scale.set(.72, 1.0, .42);
  chest.position.set(0, .88, .55);
  chest.castShadow = true;

  const head = new THREE.Group();
  head.name = 'head';
  head.position.y = 1.88;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(.58, 36, 28), fur);
  headMesh.scale.set(1.02, .92, .92);
  headMesh.castShadow = true;
  head.add(headMesh);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(.28, 24, 18), furLight);
  muzzle.scale.set(1.18, .68, .62);
  muzzle.position.set(0, -.13, .48);
  head.add(muzzle);

  const makeEar = (x: number, zRotation: number): THREE.Group => {
    const ear = new THREE.Group();
    const outer = new THREE.Mesh(new THREE.ConeGeometry(.24, .48, 3), fur);
    outer.rotation.z = zRotation;
    outer.rotation.x = -.08;
    const inner = new THREE.Mesh(new THREE.ConeGeometry(.13, .29, 3), accent);
    inner.position.z = .025;
    inner.rotation.z = zRotation;
    inner.rotation.x = -.08;
    ear.add(outer, inner);
    ear.position.set(x, .46, -.02);
    return ear;
  };
  const leftEar = makeEar(-.37, -.08);
  const rightEar = makeEar(.37, .08);
  leftEar.name = 'left-ear';
  rightEar.name = 'right-ear';
  head.add(leftEar, rightEar);

  for (const x of [-.22, .22]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.085, 20, 16), dark);
    eye.scale.y = 1.12;
    eye.position.set(x, .05, .53);
    head.add(eye);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.022, 12, 10), furLight);
    glint.position.set(x - .02, .08, .605);
    head.add(glint);
  }
  const nose = new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 12), accent);
  nose.scale.set(1.15, .72, .7);
  nose.position.set(0, -.12, .7);
  head.add(nose);

  const makePaw = (x: number): THREE.Mesh => {
    const paw = new THREE.Mesh(new THREE.CapsuleGeometry(.16, .42, 5, 12), fur);
    paw.position.set(x, .34, .37);
    paw.rotation.x = .12;
    paw.castShadow = true;
    return paw;
  };

  const tail = new THREE.Group();
  tail.name = 'tail';
  tail.position.set(-.62, .88, -.18);
  for (let i = 0; i < 4; i++) {
    const segment = new THREE.Mesh(new THREE.CapsuleGeometry(.105 - i * .008, .34, 5, 10), fur);
    segment.rotation.z = Math.PI / 2 + .18;
    segment.position.set(-.18 - i * .27, .08 + i * .11, -.08);
    segment.castShadow = true;
    tail.add(segment);
  }
  const collar = new THREE.Mesh(new THREE.TorusGeometry(.43, .035, 10, 32), accent);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.47;
  cat.add(body, chest, head, makePaw(-.38), makePaw(.38), tail, collar);
  cat.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  return { group: cat, head, tail, leftEar, rightEar, materialColors };
}

export function normalizeBuddyModel(model: THREE.Object3D, compact: boolean): void {
  model.updateMatrixWorld(true);
  let box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const targetHeight = compact ? 2.6 : 2.85;
  const scale = targetHeight / Math.max(.01, size.y);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= box.min.y + .34;
}
