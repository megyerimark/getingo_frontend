import { TestBed } from '@angular/core/testing';
import { BuddySceneFactory } from './buddy-scene-factory';

describe('BuddySceneFactory', () => {
  let factory: BuddySceneFactory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    factory = TestBed.inject(BuddySceneFactory);
  });

  it('creates the procedural Buddy with animation reference groups', () => {
    const buddy = factory.createProceduralBuddy();
    expect(buddy.root.name).toBe('getingo-procedural-buddy');
    expect(buddy.head.name).toBe('head');
    expect(buddy.tail.name).toBe('tail');
    expect(buddy.colorMaterials.length).toBeGreaterThan(0);
  });

  it('creates isolated room and action props', () => {
    const room = factory.createRoom();
    const props = factory.createProps();
    expect(room.children.length).toBeGreaterThan(3);
    expect(props.heartParticles.length).toBe(5);
    expect(props.fish.visible).toBeFalse();
    expect(props.waterBowl.visible).toBeFalse();
  });
});
