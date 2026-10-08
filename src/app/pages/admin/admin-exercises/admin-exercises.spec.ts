import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AdminExercises } from './admin-exercises';

describe('AdminExercises', () => {
  let component: AdminExercises;
  let fixture: ComponentFixture<AdminExercises>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminExercises],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminExercises);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
