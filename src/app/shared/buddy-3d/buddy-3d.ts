import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as THREE from 'three';
import { BuddyRoomKey, CompanionActionEvent, CompanionState, CompanionVisualAction } from '../../core/models/companion.model';
import { applyBuddySkin, rebuildBuddyExtras } from './lib/buddy-3d-effects';
import { createProceduralBuddy, loadBuddyGltf, normalizeBuddyModel } from './lib/buddy-3d-model';
import { applyBuddyRoom, createBuddyProps, createBuddyRoom, createBuddyThreeContext, disposeBuddyGroup } from './lib/buddy-3d-scene';

type BuddyAmbientState = 'idle' | 'walk' | 'sit' | 'sleep' | 'hungry' | 'thirsty' | 'lonely' | 'happy';

@Component({
  selector: 'app-buddy-3d',
  imports: [],
  templateUrl: './buddy-3d.html',
  styleUrl: './buddy-3d.scss'
})
export class Buddy3D implements AfterViewInit, OnChanges, OnDestroy {
  @Input() state: CompanionState | null = null;
  @Input() compact = false;
  @Input() premium = false;
  @Input() room: BuddyRoomKey = 'studio';
  @Input() modelUrl = '/models/getingo-buddies/getingo-mouse.glb';
  @Input() actionEvent: CompanionActionEvent | null = null;
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  modelStatus: 'loading' | 'ready' | 'fallback' | 'error' = 'loading';
  modelStatusText = 'A 3D Buddy modell betöltése…';
  animationMode: 'rigged' | 'fallback' = 'fallback';
  animationClipCount = 0;

  private renderer?: THREE.WebGLRenderer;
  private scene?: THREE.Scene;
  private camera?: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private resizeObserver?: ResizeObserver;
  private visibilityObserver?: IntersectionObserver;
  private isVisible = true;
  private animationFrame = 0;

  private buddyRoot = new THREE.Group();
  private modelContainer = new THREE.Group();
  private model?: THREE.Object3D;
  private mixer?: THREE.AnimationMixer;
  private clips: THREE.AnimationClip[] = [];
  private activeClip?: THREE.AnimationAction;
  private idleClip?: THREE.AnimationAction;
  private headBone?: THREE.Object3D;
  private tailBone?: THREE.Object3D;
  private leftEarBone?: THREE.Object3D;
  private rightEarBone?: THREE.Object3D;
  private headBase = new THREE.Euler();
  private tailBase = new THREE.Euler();
  private leftEarBase = new THREE.Euler();
  private rightEarBase = new THREE.Euler();
  private blinkTargets: Array<{ mesh: THREE.Mesh; index: number }> = [];
  private originalMaterialColors = new Map<THREE.Material, THREE.Color>();

  private roomGroup = createBuddyRoom();
  private extras = new THREE.Group();
  private propsBundle = createBuddyProps();
  private props = this.propsBundle.group;
  private fish = this.propsBundle.fish;
  private waterBowl = this.propsBundle.waterBowl;
  private toyBall = this.propsBundle.toyBall;
  private heartParticles = this.propsBundle.heartParticles;
  private reactionParticles = this.propsBundle.reactionParticles;
  private baseGrowthScale = 1;

  private pointerTarget = new THREE.Vector2();
  private manualRotation = 0;
  private dragStartX = 0;
  private dragging = false;
  private moved = false;
  private action: CompanionVisualAction | null = null;
  private actionStarted = 0;
  private actionDuration = 1.6;
  private ambientState: BuddyAmbientState = 'idle';
  private ambientStateStarted = 0;
  private ambientStateDuration = 5600;
  private ambientCycle = 0;
  private initialized = false;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.initThree();
    this.initialized = true;
    this.applyRoom();
    this.loadBuddyModel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['state'] || changes['premium']) {
      this.applyState();
      this.syncAmbientState(true);
    }
    if (changes['room']) this.applyRoom();
    if (changes['modelUrl'] && !changes['modelUrl'].firstChange) this.loadBuddyModel();
    if (changes['actionEvent'] && this.actionEvent && !changes['actionEvent'].firstChange) {
      if (this.actionEvent.type === 'pet') this.pet();
      else if (this.actionEvent.type === 'rest') this.rest();
      else if (this.actionEvent.type === 'water' || this.actionEvent.type === 'feed' || this.actionEvent.type === 'play') this.playAction(this.actionEvent.type);
      else this.playVisualReaction(this.actionEvent.type);
    }
  }

  playAction(action: 'water' | 'feed' | 'play'): void {
    this.startAction(action, action === 'play' ? 2.15 : 2.35);
    const names: Record<'water' | 'feed' | 'play', string[]> = {
      feed: ['eat', 'feeding', 'bite', 'chew', 'lick'],
      water: ['drink', 'drinking', 'sip', 'lick'],
      play: ['play', 'jump', 'pounce', 'attack', 'run']
    };
    this.playBestClip(names[action], false);
  }

  pet(): void {
    this.startAction('pet', 1.45);
    this.playBestClip(['happy', 'pet', 'wave', 'purr', 'idle'], false);
  }

  rest(): void {
    this.startAction('rest', 3.2);
    this.playBestClip(['sleep', 'rest', 'lie', 'lay', 'sit'], false);
  }

  playVisualReaction(action: 'celebrate' | 'focus' | 'signature' | 'level_up'): void {
    const duration = action === 'signature' ? 2.25 : action === 'focus' ? 2.0 : action === 'level_up' ? 2.2 : 1.65;
    this.startAction(action, duration);
    if (action === 'celebrate') this.playBestClip(['happy', 'jump', 'dance', 'wave', 'play'], false);
    if (action === 'focus') this.playBestClip(['idle', 'sit', 'look'], false);
    if (action === 'signature') this.playBestClip(['signature', 'special', 'attack', 'dance', 'jump', 'run', 'happy'], false);
    if (action === 'level_up') this.playBestClip(['level_up', 'levelup', 'evolution', 'celebrate', 'happy'], false);
  }

  resetView(): void {
    this.manualRotation = 0;
    this.pointerTarget.set(0, 0);
    if (this.camera) {
      this.camera.position.set(0, this.compact ? 1.48 : 1.58, this.compact ? 4.65 : 5.1);
    }
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver?.disconnect();
    this.visibilityObserver?.disconnect();
    this.mixer?.stopAllAction();
    disposeBuddyGroup(this.buddyRoot);
    disposeBuddyGroup(this.roomGroup);
    this.renderer?.dispose();
  }

  onPointerDown(event: PointerEvent): void {
    this.dragging = true;
    this.moved = false;
    this.dragStartX = event.clientX;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.pointerTarget.x = ((event.clientX - rect.left) / rect.width - .5) * 2;
    this.pointerTarget.y = ((event.clientY - rect.top) / rect.height - .5) * 2;

    if (this.dragging) {
      const delta = event.clientX - this.dragStartX;
      if (Math.abs(delta) > 3) this.moved = true;
      this.manualRotation += delta * .008;
      this.dragStartX = event.clientX;
    }
  }

  onPointerUp(): void {
    if (this.dragging && !this.moved) this.pet();
    this.dragging = false;
  }

  onWheel(event: WheelEvent): void {
    if (!this.camera) return;
    event.preventDefault();
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z + event.deltaY * .003, 3.5, 7.1);
  }

  private initThree(): void {
    const canvas = this.canvasRef.nativeElement;
    const context = createBuddyThreeContext(canvas, this.compact);
    this.renderer = context.renderer;
    this.scene = context.scene;
    this.camera = context.camera;

    this.buddyRoot.add(this.modelContainer, this.extras, this.props);
    this.scene.add(this.roomGroup, this.buddyRoot);

    const renderTarget = canvas.parentElement ?? canvas;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(renderTarget);
    this.visibilityObserver = new IntersectionObserver(entries => {
      this.isVisible = entries[0]?.isIntersecting ?? true;
    }, { rootMargin: '120px' });
    this.visibilityObserver.observe(renderTarget);
    this.resize();

    this.zone.runOutsideAngular(() => this.animate());
  }

  private async loadBuddyModel(): Promise<void> {
    this.modelStatus = 'loading';
    this.modelStatusText = 'A 3D Buddy modell betöltése…';

    this.clearModel();

    try {
      const gltf = await loadBuddyGltf(this.modelUrl);
      this.installModel(gltf.scene, gltf.animations);
      return;
    } catch {
      // Production-safe fallback: no third-party model is fetched. The generated
      // local Buddy keeps the feature usable until the final GLB is deployed.
      this.installProceduralFallback();
    }
  }

  private installModel(scene: THREE.Group, animations: THREE.AnimationClip[]): void {
    this.model = scene;
    this.clips = animations;
    this.animationClipCount = animations.length;
    this.animationMode = animations.length ? 'rigged' : 'fallback';

    scene.traverse(object => {
      object.castShadow = true;
      object.receiveShadow = true;

      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        const clones = materials.map(material => {
          const clone = material.clone();
          if (clone instanceof THREE.MeshStandardMaterial) {
            clone.envMapIntensity = 1.15;
            clone.roughness = Math.max(.35, clone.roughness ?? .7);
          }
          if ((clone as THREE.Material & { color?: THREE.Color }).color) {
            const color = (clone as THREE.Material & { color: THREE.Color }).color;
            this.originalMaterialColors.set(clone, color.clone());
          }
          return clone;
        });
        object.material = Array.isArray(object.material) ? clones : clones[0];
        this.captureBlinkTargets(object);
      }

      const name = object.name.toLowerCase();
      if (!this.headBone && /(head|neck|skull)/.test(name)) {
        this.headBone = object;
        this.headBase.copy(object.rotation);
      }
      if (!this.tailBone && /tail/.test(name)) {
        this.tailBone = object;
        this.tailBase.copy(object.rotation);
      }
      if (!this.leftEarBone && /(ear.*l|left.*ear|ear_l)/.test(name)) {
        this.leftEarBone = object;
        this.leftEarBase.copy(object.rotation);
      }
      if (!this.rightEarBone && /(ear.*r|right.*ear|ear_r)/.test(name)) {
        this.rightEarBone = object;
        this.rightEarBase.copy(object.rotation);
      }
    });

    normalizeBuddyModel(scene, this.compact);
    this.modelContainer.add(scene);

    if (animations.length) {
      this.mixer = new THREE.AnimationMixer(scene);
      this.idleClip = this.findClip(['idle', 'breath', 'sit', 'stand']) ?? this.mixer.clipAction(animations[0]);
      this.idleClip.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(.25).play();
      this.activeClip = this.idleClip;
    }

    this.modelStatus = 'ready';
    this.modelStatusText = animations.length
      ? `Getingo Buddy · ${animations.length} beépített animációs clip aktív`
      : 'Getingo Buddy · MMORPG fallback mozgások aktívak';

    this.applyState();
    this.syncAmbientState(true);
  }

  private installProceduralFallback(): void {
    const buddy = createProceduralBuddy();
    this.originalMaterialColors = buddy.materialColors;
    this.model = buddy.group;
    this.modelContainer.add(buddy.group);
    this.headBone = buddy.head;
    this.headBase.copy(buddy.head.rotation);
    this.tailBone = buddy.tail;
    this.tailBase.copy(buddy.tail.rotation);
    this.leftEarBone = buddy.leftEar;
    this.leftEarBase.copy(buddy.leftEar.rotation);
    this.rightEarBone = buddy.rightEar;
    this.rightEarBase.copy(buddy.rightEar.rotation);
    this.animationMode = 'fallback';
    this.animationClipCount = 0;
    this.modelStatus = 'fallback';
    this.modelStatusText = 'Helyi Getingo 3D tartalékmodell aktív · MMORPG fallback mozgások';
    this.applyState();
    this.syncAmbientState(true);
  }


  private captureBlinkTargets(mesh: THREE.Mesh): void {
    const dictionary = mesh.morphTargetDictionary;
    if (!dictionary || !mesh.morphTargetInfluences) return;

    Object.entries(dictionary).forEach(([name, index]) => {
      if (/(blink|eye.*close|close.*eye|wink)/i.test(name)) {
        this.blinkTargets.push({ mesh, index: Number(index) });
      }
    });
  }

  private clearModel(): void {
    this.mixer?.stopAllAction();
    this.mixer = undefined;
    this.activeClip = undefined;
    this.idleClip = undefined;
    this.clips = [];
    this.animationMode = 'fallback';
    this.animationClipCount = 0;
    this.headBone = undefined;
    this.tailBone = undefined;
    this.leftEarBone = undefined;
    this.rightEarBone = undefined;
    this.blinkTargets = [];
    this.originalMaterialColors.clear();

    disposeBuddyGroup(this.modelContainer);
    this.modelContainer.clear();
    this.model = undefined;
  }

  private startAction(action: CompanionVisualAction, duration: number): void {
    this.action = action;
    this.actionStarted = performance.now();
    this.actionDuration = duration;
    this.resetProps();

    if (action === 'feed' && this.fish) this.fish.visible = true;
    if (action === 'water' && this.waterBowl) this.waterBowl.visible = true;
    if (action === 'play' && this.toyBall) this.toyBall.visible = true;
    if (action === 'pet') this.heartParticles.forEach(item => item.visible = true);
    if (action === 'celebrate' || action === 'focus' || action === 'signature' || action === 'level_up') {
      this.reactionParticles.forEach(item => item.visible = true);
    }
  }

  private playBestClip(names: string[], loop = false): boolean {
    const next = this.findClip(names);
    if (!next) return false;

    if (this.activeClip && this.activeClip !== next) this.activeClip.fadeOut(.18);
    next.reset();
    next.enabled = true;
    next.setEffectiveTimeScale(1);
    next.setEffectiveWeight(1);
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.fadeIn(.18).play();
    this.activeClip = next;
    return true;
  }

  private findClip(names: string[]): THREE.AnimationAction | undefined {
    if (!this.mixer || !this.clips.length) return undefined;
    const lowered = names.map(name => name.toLowerCase());
    const clip = this.clips.find(item => {
      const name = item.name.toLowerCase();
      return lowered.some(wanted => name.includes(wanted));
    });
    return clip ? this.mixer.clipAction(clip) : undefined;
  }

  private returnToIdle(): void {
    this.setAmbientState('idle', true);
  }

  private syncAmbientState(force = false): void {
    if (!this.state || this.action) return;
    const behavior = this.state.behavior?.key ?? 'idle';
    let next: BuddyAmbientState = 'idle';
    if (behavior === 'tired') next = 'sleep';
    else if (behavior === 'hungry') next = 'hungry';
    else if (behavior === 'thirsty') next = 'thirsty';
    else if (behavior === 'lonely') next = 'lonely';
    else if (behavior === 'happy') next = 'happy';
    this.setAmbientState(next, force);
  }

  private updateAmbientState(now: number): void {
    if (this.action || !this.state) return;

    const behavior = this.state.behavior?.key ?? 'idle';
    if (behavior !== 'idle') {
      this.syncAmbientState();
      return;
    }

    if (!this.ambientStateStarted) {
      this.setAmbientState('idle', true);
      return;
    }

    if (now - this.ambientStateStarted < this.ambientStateDuration) return;

    const sequence: BuddyAmbientState[] = ['idle', 'walk', 'idle', 'sit', 'walk', 'idle'];
    this.ambientCycle = (this.ambientCycle + 1) % sequence.length;
    this.setAmbientState(sequence[this.ambientCycle], true);
  }

  private setAmbientState(next: BuddyAmbientState, force = false): void {
    if (!force && this.ambientState === next) return;

    const previous = this.ambientState;
    this.ambientState = next;
    this.ambientStateStarted = performance.now();
    this.ambientStateDuration = next === 'sleep' ? 12000 : next === 'walk' ? 6500 : next === 'sit' ? 7200 : 5600;
    this.applyAmbientProps();

    if (previous === 'sleep' && next !== 'sleep') {
      const woke = this.playBestClip(['wake_up', 'wakeup', 'wake'], false);
      if (woke) return;
    }

    const aliases: Record<BuddyAmbientState, string[]> = {
      idle: ['idle_2', 'idle', 'breath', 'stand'],
      walk: ['walk', 'walking', 'run'],
      sit: ['sit', 'sitting', 'rest'],
      sleep: ['sleep', 'sleeping', 'lie_down', 'lie', 'lay'],
      hungry: ['hungry', 'sniff', 'look', 'idle'],
      thirsty: ['thirsty', 'look', 'idle'],
      lonely: ['sad', 'lonely', 'idle'],
      happy: ['happy', 'excited', 'idle']
    };

    if (!this.playBestClip(aliases[next], true) && next === 'idle' && this.idleClip) {
      if (this.activeClip && this.activeClip !== this.idleClip) this.activeClip.fadeOut(.22);
      this.idleClip.reset().setLoop(THREE.LoopRepeat, Infinity).fadeIn(.25).play();
      this.activeClip = this.idleClip;
    }
  }

  private applyAmbientProps(): void {
    if (this.action) return;
    this.resetProps();
    if (this.ambientState === 'hungry' && this.fish) this.fish.visible = true;
    if (this.ambientState === 'thirsty' && this.waterBowl) this.waterBowl.visible = true;
  }


  private resetProps(): void {
    if (this.fish) this.fish.visible = false;
    if (this.waterBowl) this.waterBowl.visible = false;
    if (this.toyBall) this.toyBall.visible = false;
    this.heartParticles.forEach(item => item.visible = false);
    this.reactionParticles.forEach(item => item.visible = false);
  }

  private applyState(): void {
    if (!this.state) return;

    const growthScale = .92 + ((this.state.growth.level - 1) / 99) * .18;
    this.baseGrowthScale = growthScale;
    this.modelContainer.scale.setScalar(growthScale);
    rebuildBuddyExtras(this.extras, this.state.growth.level, this.state.growth.era, this.state.companion.selected_skin, this.premium);
    applyBuddySkin(this.model, this.originalMaterialColors, this.extras, this.reactionParticles, this.state.companion.selected_skin);
  }


  private applyRoom(): void {
    if (!this.scene) return;
    applyBuddyRoom(this.scene, this.renderer, this.roomGroup, this.room);
  }

  private animate = (): void => {
    if (!this.isVisible || document.hidden) {
      this.clock.getDelta();
      this.animationFrame = requestAnimationFrame(this.animate);
      return;
    }

    const delta = Math.min(.05, this.clock.getDelta());
    const t = this.clock.elapsedTime;
    this.mixer?.update(delta);
    this.updateAmbientState(performance.now());

    const mood = this.state?.mood.key ?? 'happy';
    const speed = mood === 'radiant' ? 1.18 : mood === 'wilted' ? .72 : 1;
    const elapsed = this.action ? (performance.now() - this.actionStarted) / 1000 : 0;
    const actionProgress = this.action ? THREE.MathUtils.clamp(elapsed / this.actionDuration, 0, 1) : 0;
    const pulse = Math.sin(actionProgress * Math.PI);

    if (this.action && elapsed >= this.actionDuration) {
      this.action = null;
      this.resetProps();
      this.syncAmbientState(true);
    }

    const idleFloat = Math.sin(t * 2.0 * speed) * .018;
    let ambientX = 0;
    let ambientZ = 0;
    let ambientLift = 0;
    let ambientTilt = 0;
    let ambientRoll = 0;
    let ambientYaw = 0;

    if (!this.action) {
      if (this.ambientState === 'walk') {
        ambientX = Math.sin(t * .72) * .62;
        ambientZ = Math.cos(t * .72) * .12;
        ambientLift = Math.abs(Math.sin(t * 4.4)) * .045;
        ambientYaw = Math.cos(t * .72) >= 0 ? .16 : -.16;
      } else if (this.ambientState === 'sit') {
        ambientLift = -.085;
        ambientTilt = -.055;
      } else if (this.ambientState === 'sleep') {
        ambientLift = -.16 + Math.sin(t * 1.1) * .006;
        ambientTilt = -.2;
        ambientRoll = .12;
      } else if (this.ambientState === 'hungry') {
        ambientTilt = .08 + Math.sin(t * 2.3) * .02;
        ambientX = .08;
      } else if (this.ambientState === 'thirsty') {
        ambientTilt = -.08 + Math.sin(t * 2.1) * .018;
        ambientX = -.08;
      } else if (this.ambientState === 'lonely') {
        ambientRoll = Math.sin(t * 1.6) * .035;
        ambientLift = -.03;
      } else if (this.ambientState === 'happy') {
        ambientLift = Math.abs(Math.sin(t * 2.9)) * .075;
        ambientRoll = Math.sin(t * 2.2) * .025;
      }
    }

    let actionLift = 0;
    let actionTilt = 0;
    let actionSpin = 0;
    let actionRoll = 0;
    let actionScale = 1;

    if (this.action === 'play') {
      actionLift = pulse * .42;
      actionSpin = pulse * Math.PI * 1.2;
      if (this.toyBall) {
        this.toyBall.position.set(Math.sin(t * 5) * .7, -.05 + Math.abs(Math.sin(t * 6)) * .85, .9);
      }
    }
    if (this.action === 'feed') {
      actionTilt = .12 * pulse;
      if (this.fish) {
        this.fish.position.set(1.25 - pulse * 1.2, .55 + pulse * .85, .8 - pulse * .32);
        this.fish.rotation.z = Math.sin(t * 8) * .18;
      }
    }
    if (this.action === 'water') {
      actionTilt = -.15 * pulse;
    }
    if (this.action === 'pet') {
      actionTilt = .08 * pulse;
      this.heartParticles.forEach((heart, index) => {
        heart.position.set(-.45 + index * .22, 1.55 + pulse * (.5 + index * .06), .7 - index * .08);
        heart.scale.setScalar(.8 + pulse * .8);
      });
    }
    if (this.action === 'rest') {
      actionTilt = -.22 * pulse;
      actionLift = -.06 * pulse;
      actionScale = 1 - pulse * .025;
    }
    if (this.action === 'celebrate') {
      actionLift = Math.sin(actionProgress * Math.PI * 2) * .16 + pulse * .34;
      actionSpin = pulse * Math.PI * 1.6;
      actionScale = 1 + pulse * .045;
    }
    if (this.action === 'focus') {
      actionLift = pulse * .1;
      actionTilt = Math.sin(t * 5) * .025 * pulse;
      actionScale = 1 + pulse * .025;
    }
    if (this.action === 'signature') {
      const skin = this.state?.companion.selected_skin ?? 'getingo-mouse';
      if (skin === 'getingo-shark') {
        actionSpin = Math.sin(actionProgress * Math.PI * 3) * .72;
        actionRoll = Math.sin(actionProgress * Math.PI * 4) * .18;
        actionLift = pulse * .24;
      } else if (skin === 'getingo-dragon') {
        actionSpin = pulse * Math.PI * 2.1;
        actionLift = pulse * .48;
        actionTilt = -.14 * pulse;
      } else if (skin === 'getingo-reindeer') {
        actionLift = Math.abs(Math.sin(actionProgress * Math.PI * 3)) * .34;
        actionRoll = Math.sin(actionProgress * Math.PI * 3) * .08;
      } else if (skin === 'getingo-sloth') {
        actionRoll = Math.sin(actionProgress * Math.PI * 2) * .23;
        actionLift = pulse * .1;
        actionScale = 1 + pulse * .035;
      } else {
        actionSpin = Math.sin(actionProgress * Math.PI * 4) * .45;
        actionLift = pulse * .3;
      }
    }

    if (this.action === 'celebrate' || this.action === 'focus' || this.action === 'signature' || this.action === 'level_up') {
      this.reactionParticles.forEach((particle, index) => {
        const phase = (index / Math.max(1, this.reactionParticles.length)) * Math.PI * 2;
        const radius = this.action === 'focus' ? .9 + pulse * .22 : .48 + pulse * 1.15;
        const height = this.action === 'focus' ? 1.25 + Math.sin(t * 2 + phase) * .35 : .45 + pulse * (1.2 + (index % 4) * .16);
        particle.position.set(Math.cos(phase + t * (this.action === 'focus' ? .8 : 1.8)) * radius, height, Math.sin(phase + t * 1.35) * radius * .55);
        particle.scale.setScalar(.65 + pulse * 1.15);
        particle.rotation.x += .03;
        particle.rotation.y += .04;
      });
    }

    this.modelContainer.position.x = ambientX;
    this.modelContainer.position.y = idleFloat + ambientLift + actionLift;
    this.modelContainer.position.z = ambientZ;
    this.modelContainer.rotation.y = this.manualRotation + ambientYaw + actionSpin;
    this.modelContainer.rotation.x = ambientTilt + actionTilt;
    this.modelContainer.rotation.z = ambientRoll + actionRoll;
    this.modelContainer.scale.setScalar(this.baseGrowthScale * actionScale);

    if (this.headBone) {
      this.headBone.rotation.x = this.headBase.x + THREE.MathUtils.lerp(0, -this.pointerTarget.y * .06, .7);
      this.headBone.rotation.y = this.headBase.y + THREE.MathUtils.lerp(0, this.pointerTarget.x * .12, .7);
      this.headBone.rotation.z = this.headBase.z - this.pointerTarget.x * .025;
    }

    if (this.tailBone) {
      this.tailBone.rotation.y = this.tailBase.y + Math.sin(t * 1.7 * speed) * .13;
      this.tailBone.rotation.z = this.tailBase.z + Math.sin(t * 2.25 * speed) * .08;
    }
    if (this.leftEarBone) this.leftEarBone.rotation.z = this.leftEarBase.z + Math.sin(t * 4.9) * .018;
    if (this.rightEarBone) this.rightEarBone.rotation.z = this.rightEarBase.z - Math.sin(t * 5.1) * .018;

    const blinkPhase = t % 4.8;
    const blink = blinkPhase > 4.58 ? 1 - Math.min(1, Math.abs(blinkPhase - 4.69) * 9) : 0;
    this.blinkTargets.forEach(target => {
      if (target.mesh.morphTargetInfluences) target.mesh.morphTargetInfluences[target.index] = blink;
    });

    this.extras.children.forEach((child, index) => {
      if (child.userData['spin']) child.rotation.y += .018;
      if (child.userData['spinReverse']) child.rotation.y -= .012;
      if (child.userData['pulse']) {
        const scale = 1 + Math.sin(t * 2.2 + index) * .08;
        child.scale.setScalar(scale);
      }
      if (child.userData['orbit']) {
        const phase = Number(child.userData['orbitPhase'] ?? 0);
        const radius = Number(child.userData['orbitRadius'] ?? 1.1);
        const orbitSpeed = Number(child.userData['orbitSpeed'] ?? .5);
        const height = Number(child.userData['orbitHeight'] ?? 1.55);
        const angle = t * orbitSpeed + phase;
        child.position.set(Math.cos(angle) * radius, height + Math.sin(t * 1.6 + phase) * .11, Math.sin(angle) * radius * .55);
        child.rotation.x += .012;
        child.rotation.y += .016;
      }
      if (child.userData['trail']) {
        const offset = Number(child.userData['trailOffset'] ?? index);
        const angle = t * .9 - offset * .45;
        child.position.set(Math.cos(angle) * (.9 + offset * .06), .72 + offset * .22 + Math.sin(t * 2 + offset) * .08, Math.sin(angle) * .42);
      }
    });

    this.roomGroup.children.forEach((child, index) => {
      if (child.userData['floatOffset'] !== undefined) {
        child.position.y += Math.sin(t * 1.22 + index) * .00042;
      }
    });

    this.renderer?.render(this.scene!, this.camera!);
    this.animationFrame = requestAnimationFrame(this.animate);
  };

  private resize(): void {
    if (!this.renderer || !this.camera) return;
    const parent = this.canvasRef.nativeElement.parentElement ?? this.canvasRef.nativeElement;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }


}
