import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Projects } from './projects';
import { ProjectService } from '../../services/project';
import { Project } from '../../core/models/project.model';

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 1, title: 'Teszt projekt', description: 'Leírás', difficulty: 'kezdő', estimated_time: 30,
  xp_reward: 25, is_completed: false, timer_started: false, is_expired: false, ...overrides
});

describe('Projects', () => {
  let component: Projects;
  let fixture: ComponentFixture<Projects>;
  const service = jasmine.createSpyObj<ProjectService>('ProjectService', ['getAll']);

  beforeEach(async () => {
    service.getAll.and.returnValue(of([project()]));
    await TestBed.configureTestingModule({ imports: [Projects], providers: [{ provide: ProjectService, useValue: service }] }).compileComponents();
    fixture = TestBed.createComponent(Projects);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  it('shows an unstarted project without counting down', () => {
    const item = component.projects[0];
    expect(item.timer_started).toBeFalse();
    expect(component.countdown(item)).toContain('30');
    expect(component.isExpired(item)).toBeFalse();
  });

  it('treats completed projects as non-expired', () => {
    const item = project({ is_completed: true, is_expired: true });
    expect(component.isExpired(item)).toBeFalse();
    expect(component.countdown(item)).toBe('Kész');
  });
});
