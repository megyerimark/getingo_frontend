import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { AdminProjects } from './admin-projects';

describe('AdminProjects', () => {
  let component: AdminProjects;
  let fixture: ComponentFixture<AdminProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProjects],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProjects);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
