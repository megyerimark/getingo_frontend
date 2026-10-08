import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Tasks } from './tasks';
import { ExerciseService, StudentExercise } from '../../services/exercise';
import { ToastService } from '../../services/toast';

const item: StudentExercise = {
  id: 4, category_id: 1, title: 'Feladat', description: 'Leírás', difficulty: 'kezdő', estimated_time: 15,
  submission: null
};

describe('Tasks', () => {
  let component: Tasks;
  let fixture: ComponentFixture<Tasks>;
  const exercises = jasmine.createSpyObj<ExerciseService>('ExerciseService', ['list', 'open', 'save']);
  const toast = jasmine.createSpyObj<ToastService>('ToastService', ['success', 'error']);

  beforeEach(async () => {
    exercises.list.and.returnValue(of([item]));
    exercises.open.and.returnValue(of({ ...item, submission: { id: 2, answer: 'x', started_at: new Date().toISOString(), expires_at: new Date(Date.now() + 60000).toISOString(), completed_at: null, is_expired: false } }));
    exercises.save.and.returnValue(of({ message: 'Mentve', submission: { id: 2, answer: 'új', started_at: null, expires_at: null, completed_at: null, is_expired: false } }));
    await TestBed.configureTestingModule({ imports: [Tasks], providers: [{ provide: ExerciseService, useValue: exercises }, { provide: ToastService, useValue: toast }] }).compileComponents();
    fixture = TestBed.createComponent(Tasks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => component.ngOnDestroy());

  it('loads a task and its saved workspace', () => {
    component.open(item);
    expect(exercises.open).toHaveBeenCalledWith(4);
    expect(component.selected?.id).toBe(4);
    expect(component.answer).toBe('x');
  });

  it('does not save an expired task', () => {
    component.selected = { ...item, submission: { id: 1, answer: '', started_at: null, expires_at: new Date(Date.now() - 1000).toISOString(), completed_at: null, is_expired: true } };
    exercises.save.calls.reset();
    component.save();
    expect(exercises.save).not.toHaveBeenCalled();
  });
});
