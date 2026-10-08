import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BuddyRoomKey } from '../../../core/models/companion.model';

export interface BuddyThreeContext {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function createBuddyThreeContext(canvas: HTMLCanvasElement, compact: boolean): BuddyThreeContext {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .05, 100);
  camera.position.set(0, compact ? 1.48 : 1.58, compact ? 4.65 : 5.1);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  pmrem.dispose();

  const hemi = new THREE.HemisphereLight(0xf2f7ff, 0x0d1930, 2.2);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff5e9, 4.1);
  key.position.set(4.4, 7.2, 4.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -.00035;
  scene.add(key);

  const fill = new THREE.PointLight(0x8bc5ff, 14, 11);
  fill.position.set(-3.4, 3.0, 3.0);
  scene.add(fill);

  const rim = new THREE.PointLight(0xa18bff, 18, 12);
  rim.position.set(3.3, 3.5, -2.6);
  scene.add(rim);

  const warm = new THREE.PointLight(0xffd7b0, 8, 8);
  warm.position.set(-2.1, 4.0, -1.7);
  scene.add(warm);

  return { renderer, scene, camera };
}

export interface BuddyPropsBundle {
  group: THREE.Group;
  fish: THREE.Group;
  waterBowl: THREE.Group;
  toyBall: THREE.Mesh;
  heartParticles: THREE.Mesh[];
  reactionParticles: THREE.Mesh[];
}

export function createBuddyRoom(): THREE.Group {
  const group = new THREE.Group();
  const floor = new THREE.Mesh(
    new THREE.CylinderGeometry(2.45, 2.65, .2, 72),
    new THREE.MeshPhysicalMaterial({ color: 0x10355f, roughness: .65, metalness: .14, clearcoat: .35 })
  );
  floor.position.y = -.55;
  floor.receiveShadow = true;
  floor.name = 'buddy-floor';
  group.add(floor);

  const bed = new THREE.Mesh(
    new THREE.CylinderGeometry(1.25, 1.4, .14, 64),
    new THREE.MeshPhysicalMaterial({ color: 0x204b83, roughness: .88, sheen: .7, sheenColor: new THREE.Color(0x9fc7ff) })
  );
  bed.position.y = -.38;
  bed.receiveShadow = true;
  bed.name = 'buddy-bed';
  group.add(bed);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.57, .028, 12, 80),
    new THREE.MeshStandardMaterial({ color: 0x7ce6ff, emissive: 0x168fdb, emissiveIntensity: 3 })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -.29;
  group.add(ring);

  for (let i = 0; i < 8; i++) {
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(.035 + (i % 3) * .008, 14, 12),
      new THREE.MeshStandardMaterial({
        color: i % 2 ? 0xb493ff : 0x78ddff,
        emissive: i % 2 ? 0x7040d7 : 0x0786ca,
        emissiveIntensity: 3.1
      })
    );
    const angle = (i / 8) * Math.PI * 2;
    orb.position.set(Math.cos(angle) * 2.05, .25 + (i % 3) * .31, Math.sin(angle) * .9 - .55);
    orb.userData['floatOffset'] = i;
    group.add(orb);
  }
  return group;
}

export function createBuddyProps(): BuddyPropsBundle {
  const group = new THREE.Group();
  const fish = new THREE.Group();
  const fishBody = new THREE.Mesh(
    new THREE.SphereGeometry(.13, 18, 12),
    new THREE.MeshPhysicalMaterial({ color: 0x67c7ff, roughness: .38, clearcoat: .5 })
  );
  fishBody.scale.set(1.65, .75, .55);
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(.11, .22, 3),
    new THREE.MeshPhysicalMaterial({ color: 0x3ca5ed, roughness: .45 })
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.x = -.24;
  fish.add(fishBody, tail);
  fish.visible = false;
  group.add(fish);

  const waterBowl = new THREE.Group();
  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(.35, .29, .12, 32, 1, true),
    new THREE.MeshPhysicalMaterial({ color: 0x2563eb, roughness: .28, metalness: .18, clearcoat: .8 })
  );
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(.29, .29, .025, 32),
    new THREE.MeshPhysicalMaterial({ color: 0x65d9ff, transparent: true, opacity: .72, roughness: .05 })
  );
  water.position.y = .065;
  waterBowl.add(bowl, water);
  waterBowl.position.set(0, -.25, 1.15);
  waterBowl.visible = false;
  group.add(waterBowl);

  const toyBall = new THREE.Mesh(
    new THREE.SphereGeometry(.16, 24, 18),
    new THREE.MeshPhysicalMaterial({ color: 0xff5fbf, roughness: .34, clearcoat: .8, emissive: 0x5b103f, emissiveIntensity: .2 })
  );
  toyBall.visible = false;
  group.add(toyBall);

  const heartParticles: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const heart = new THREE.Mesh(
      new THREE.SphereGeometry(.045 + i * .005, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xff7eb6, emissive: 0xff3f8f, emissiveIntensity: 1.6 })
    );
    heart.visible = false;
    heartParticles.push(heart);
    group.add(heart);
  }

  const reactionParticles: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const particle = new THREE.Mesh(
      i % 3 === 0 ? new THREE.OctahedronGeometry(.045 + (i % 4) * .006, 0) : new THREE.SphereGeometry(.035 + (i % 3) * .006, 10, 8),
      new THREE.MeshStandardMaterial({
        color: i % 2 ? 0xa78bfa : 0x67e8f9,
        emissive: i % 2 ? 0x7c3aed : 0x0891b2,
        emissiveIntensity: 2.8,
        transparent: true,
        opacity: .92
      })
    );
    particle.visible = false;
    particle.userData['reactionParticle'] = true;
    particle.userData['offset'] = i;
    reactionParticles.push(particle);
    group.add(particle);
  }
  return { group, fish, waterBowl, toyBall, heartParticles, reactionParticles };
}

export function applyBuddyRoom(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer | undefined,
  roomGroup: THREE.Group,
  room: BuddyRoomKey
): void {
  const rooms: Record<BuddyRoomKey, { fog: number; floor: number; bed: number; exposure: number }> = {
    studio: { fog: 0x091a31, floor: 0x123e73, bed: 0x204b83, exposure: 1.15 },
    play: { fog: 0x1b1243, floor: 0x5a2a88, bed: 0x7d3bb0, exposure: 1.18 },
    night: { fog: 0x020611, floor: 0x11213d, bed: 0x1d3152, exposure: .96 },
    aurora: { fog: 0x160b2d, floor: 0x264a66, bed: 0x593f87, exposure: 1.22 },
    cyber: { fog: 0x03151a, floor: 0x073c46, bed: 0x145d66, exposure: 1.2 }
  };
  const config = rooms[room];
  scene.background = new THREE.Color(config.fog);
  scene.fog = new THREE.Fog(config.fog, 6.1, 14);
  if (renderer) renderer.toneMappingExposure = config.exposure;
  const floor = roomGroup.getObjectByName('buddy-floor') as THREE.Mesh | undefined;
  const bed = roomGroup.getObjectByName('buddy-bed') as THREE.Mesh | undefined;
  (floor?.material as THREE.MeshStandardMaterial | undefined)?.color.setHex(config.floor);
  (bed?.material as THREE.MeshStandardMaterial | undefined)?.color.setHex(config.bed);
}

export function disposeBuddyGroup(group: THREE.Group): void {
  group.traverse(object => {
    if (object instanceof THREE.Mesh || object instanceof THREE.InstancedMesh || object instanceof THREE.Line) {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => material?.dispose());
    }
  });
}
