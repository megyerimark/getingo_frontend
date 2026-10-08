import { Injectable } from '@angular/core';
import * as THREE from 'three';

export interface ProceduralBuddyModel {
  root: THREE.Group;
  head: THREE.Group;
  tail: THREE.Group;
  leftEar: THREE.Group;
  rightEar: THREE.Group;
  colorMaterials: Array<THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial>;
}

export interface BuddySceneProps {
  group: THREE.Group;
  fish: THREE.Group;
  waterBowl: THREE.Group;
  toyBall: THREE.Mesh;
  heartParticles: THREE.Mesh[];
}

@Injectable({ providedIn: 'root' })
export class BuddySceneFactory {
  createProceduralBuddy(): ProceduralBuddyModel {
    const cat = new THREE.Group();
    cat.name = 'getingo-procedural-buddy';

    const fur = new THREE.MeshPhysicalMaterial({ color: 0xb9d8ff, roughness: .72, clearcoat: .12 });
    const furLight = new THREE.MeshPhysicalMaterial({ color: 0xe9f5ff, roughness: .78, clearcoat: .08 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x17233d, roughness: .48 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x2d8cff, emissive: 0x0d4d9c, emissiveIntensity: .4, roughness: .35 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(.72, 36, 28), fur);
    body.scale.set(.88, 1.08, .78);
    body.position.y = .92;

    const chest = new THREE.Mesh(new THREE.SphereGeometry(.43, 28, 22), furLight);
    chest.scale.set(.72, 1, .42);
    chest.position.set(0, .88, .55);

    const head = new THREE.Group();
    head.name = 'head';
    head.position.y = 1.88;
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(.58, 36, 28), fur);
    headMesh.scale.set(1.02, .92, .92);
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
      return paw;
    };

    const tail = new THREE.Group();
    tail.name = 'tail';
    tail.position.set(-.62, .88, -.18);
    for (let i = 0; i < 4; i++) {
      const segment = new THREE.Mesh(new THREE.CapsuleGeometry(.105 - i * .008, .34, 5, 10), fur);
      segment.rotation.z = Math.PI / 2 + .18;
      segment.position.set(-.18 - i * .27, .08 + i * .11, -.08);
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

    return { root: cat, head, tail, leftEar, rightEar, colorMaterials: [fur, furLight, dark, accent] };
  }

  createRoom(): THREE.Group {
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

  createProps(): BuddySceneProps {
    const group = new THREE.Group();
    const fish = new THREE.Group();
    const fishBody = new THREE.Mesh(
      new THREE.SphereGeometry(.13, 18, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x67c7ff, roughness: .38, clearcoat: .5 })
    );
    fishBody.scale.set(1.65, .75, .55);
    const fishTail = new THREE.Mesh(
      new THREE.ConeGeometry(.11, .22, 3),
      new THREE.MeshPhysicalMaterial({ color: 0x3ca5ed, roughness: .45 })
    );
    fishTail.rotation.z = Math.PI / 2;
    fishTail.position.x = -.24;
    fish.add(fishBody, fishTail);
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

    return { group, fish, waterBowl, toyBall, heartParticles };
  }
}
