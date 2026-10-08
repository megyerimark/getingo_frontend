import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ProjectDetail } from './project-detail';
import { ProjectService } from '../../services/project';
import { Auth } from '../../services/auth';
import { ThemeService } from '../../services/theme';
import { ProjectRunnerService } from '../../services/project-runner';
import { Project } from '../../core/models/project.model';

const baseProject: Project = {
  id: 7,
  title: 'Projekt',
  description: 'Leírás',
  difficulty: 'kezdő',
  estimated_time: 30,
  xp_reward: 25,
  is_completed: false,
  timer_started: false,
  is_expired: false,
  starter_html: '<h1>Start</h1>',
  starter_css: '',
  starter_javascript: 'console.log("start")',
  validation_configured: true
};

describe('ProjectDetail', () => {
  let component: ProjectDetail;
  let fixture: ComponentFixture<ProjectDetail>;
  const projectService = jasmine.createSpyObj<ProjectService>('ProjectService', ['getById', 'start', 'restart', 'saveWorkspace', 'check', 'mentor']);
  const auth = { currentUser: () => null };
  const theme = { isDark: () => false };
  const runner = jasmine.createSpyObj<ProjectRunnerService>('ProjectRunnerService', ['createToken', 'buildPreviewDocument', 'isRunnerMessage']);

  beforeEach(async () => {
    projectService.getById.and.returnValue(of({ project: { ...baseProject }, submission: null }));
    projectService.start.and.returnValue(of({
      message: 'A projekt elindult.', timer_started: true, started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60000).toISOString(), remaining_seconds: 1800, is_expired: false
    }));
    projectService.restart.and.returnValue(projectService.start());
    projectService.saveWorkspace.and.returnValue(of({ message: 'Mentve' }));
    runner.createToken.and.returnValue('token');
    runner.buildPreviewDocument.and.returnValue('<!doctype html>');

    await TestBed.configureTestingModule({
      imports: [ProjectDetail],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '7' } } } },
        { provide: ProjectService, useValue: projectService },
        { provide: Auth, useValue: auth },
        { provide: ThemeService, useValue: theme },
        { provide: ProjectRunnerService, useValue: runner }
      ]
    }).overrideComponent(ProjectDetail, { set: { template: '' } }).compileComponents();

    fixture = TestBed.createComponent(ProjectDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  it('keeps the editor locked until Start is pressed', () => {
    expect(component.isNotStarted).toBeTrue();
    expect(component.isEditorLocked).toBeTrue();
    projectService.saveWorkspace.calls.reset();
    component.saveWorkspace();
    expect(projectService.saveWorkspace).not.toHaveBeenCalled();
  });

  it('starts timing only through the explicit start endpoint', () => {
    component.startProject();
    expect(projectService.start).toHaveBeenCalledWith(7);
    expect(component.project?.timer_started).toBeTrue();
    expect(component.isNotStarted).toBeFalse();
    expect(component.isEditorLocked).toBeFalse();
  });

  it('allows restart only after expiry', () => {
    if (!component.project) fail('Project was not loaded');
    component.project!.timer_started = true;
    component.project!.is_expired = true;
    component.restartProject();
    expect(projectService.restart).toHaveBeenCalledWith(7);
    expect(component.project?.is_expired).toBeFalse();
  });
});
