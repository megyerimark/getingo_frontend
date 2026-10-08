import * as THREE from 'three';
import { disposeBuddyGroup } from './buddy-3d-scene';

const ACCENTS: Record<string, number> = {
  'getingo-mouse': 0xf59e0b,
  'getingo-sloth': 0xa16207,
  'getingo-reindeer': 0xef4444,
  'getingo-shark': 0x0891b2,
  'getingo-dragon': 0x7c3aed
};

export function rebuildBuddyExtras(target: THREE.Group, level: number, era: number, skin: string, premium: boolean): void {
  disposeBuddyGroup(target);
  target.clear();
  const accent = ACCENTS[skin] ?? 0x38bdf8;
  const accentColor = new THREE.Color(accent);
  const glow = new THREE.MeshPhysicalMaterial({
    color: accent,
    emissive: accentColor.clone().multiplyScalar(.72),
    emissiveIntensity: premium ? 3.8 : 2.15,
    metalness: .28,
    roughness: .22,
    transparent: true,
    opacity: premium ? .94 : .76,
    clearcoat: .9
  });
  if (level >= 10) {
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(.1, 0), glow.clone());
    star.position.set(1.0, 1.8, .12);
    Object.assign(star.userData, { orbit: true, orbitRadius: 1.05, orbitSpeed: .62, orbitPhase: 0 });
    target.add(star);
  }
  if (!premium) {
    if (level >= 50) {
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.54, .018, 10, 54), glow.clone());
      halo.rotation.x = Math.PI / 2;
      halo.position.set(0, 2.72, 0);
      halo.userData['spin'] = true;
      target.add(halo);
    }
    return;
  }
  if (level >= 20) {
    const badge = new THREE.Mesh(new THREE.TorusGeometry(.14, .032, 10, 32), glow.clone());
    badge.position.set(.62, 1.24, .58);
    badge.rotation.x = .3;
    badge.userData['pulse'] = true;
    target.add(badge);
  }
  if (level >= 30) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, .024, 10, 80), glow.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -.22;
    Object.assign(ring.userData, { spin: true, floorRing: true });
    target.add(ring);
  }
  if (level >= 40) {
    for (let i = 0; i < 4; i++) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(.07 + i * .006, 0), glow.clone());
      Object.assign(crystal.userData, {
        orbit: true,
        orbitRadius: 1.18 + (i % 2) * .16,
        orbitSpeed: .45 + i * .08,
        orbitPhase: (i / 4) * Math.PI * 2,
        orbitHeight: 1.22 + (i % 2) * .52
      });
      target.add(crystal);
    }
  }
  if (level >= 50) {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(.13, 2), glow.clone());
    core.position.set(-1.12, 1.62, -.08);
    Object.assign(core.userData, { spin: true, pulse: true });
    target.add(core);
  }
  if (level >= 60) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.68, .026, 12, 72), glow.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 2.56, 0);
    ring.userData['spin'] = true;
    target.add(ring);
  }
  if (level >= 80) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.86, .018, 10, 76), glow.clone());
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = .25;
    ring.position.set(0, 1.42, -.28);
    ring.userData['spinReverse'] = true;
    target.add(ring);
  }
  if (level >= 90) {
    for (let i = 0; i < 5; i++) {
      const trail = new THREE.Mesh(new THREE.SphereGeometry(.028 + i * .004, 10, 8), glow.clone());
      Object.assign(trail.userData, { trail: true, trailOffset: i });
      target.add(trail);
    }
  }
  if (level >= 100 || era >= 10) {
    const crown = new THREE.Mesh(new THREE.TorusKnotGeometry(.17, .032, 72, 10), glow.clone());
    crown.position.set(0, 3.02, 0);
    Object.assign(crown.userData, { spin: true, pulse: true });
    target.add(crown);
  }
}

export function applyBuddySkin(
  model: THREE.Object3D | undefined,
  originalColors: Map<THREE.Material, THREE.Color>,
  extras: THREE.Group,
  reactionParticles: THREE.Mesh[],
  skin: string
): void {
  const accent = ACCENTS[skin] ?? ACCENTS['getingo-mouse'];
  model?.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach(material => {
      const color = (material as THREE.Material & { color?: THREE.Color }).color;
      const base = originalColors.get(material);
      if (color && base) color.copy(base);
    });
  });
  extras.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const material = object.material as THREE.MeshStandardMaterial;
    material.color?.setHex(accent);
    material.emissive?.setHex(accent).multiplyScalar(.72);
  });
  reactionParticles.forEach((particle, index) => {
    const material = particle.material as THREE.MeshStandardMaterial;
    material.color.setHex(index % 2 ? accent : 0xffffff);
    material.emissive.setHex(accent);
  });
}
